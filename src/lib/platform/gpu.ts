// Browser port of gpu-inference-k8s/gpuplan: VRAM sizing, bin-packing and a queueing
// model for cost vs latency. Prices are illustrative list prices, as in the repo.

export type Precision = "bf16" | "fp8" | "int8" | "int4";
export const BYTES: Record<Precision, number> = { bf16: 2, fp8: 1, int8: 1, int4: 0.5 };

export interface ModelSpec { id: string; label: string; paramsB: number; layers: number; kvHeads: number; headDim: number }
export interface Instance { id: string; gpu: string; memoryGb: number; gpus: number; hourly: number; mig: boolean }

export const MODELS: ModelSpec[] = [
  { id: "qwen2.5-1.5b", label: "Qwen2.5 1.5B", paramsB: 1.54, layers: 28, kvHeads: 2, headDim: 128 },
  { id: "mistral-7b", label: "Mistral 7B", paramsB: 7.24, layers: 32, kvHeads: 8, headDim: 128 },
  { id: "llama-3.1-8b", label: "Llama 3.1 8B", paramsB: 8.03, layers: 32, kvHeads: 8, headDim: 128 },
  { id: "llama-3.1-70b", label: "Llama 3.1 70B", paramsB: 70.6, layers: 80, kvHeads: 8, headDim: 128 }
];

export const INSTANCES: Instance[] = [
  { id: "g6.xlarge", gpu: "L4 24 GB", memoryGb: 24, gpus: 1, hourly: 0.805, mig: false },
  { id: "g5.xlarge", gpu: "A10G 24 GB", memoryGb: 24, gpus: 1, hourly: 1.006, mig: false },
  { id: "g6e.xlarge", gpu: "L40S 48 GB", memoryGb: 48, gpus: 1, hourly: 1.861, mig: false },
  { id: "p4d.24xlarge", gpu: "8 x A100 40 GB", memoryGb: 40, gpus: 8, hourly: 21.96, mig: true }
];

export function weightsGb(m: ModelSpec, p: Precision): number { return (m.paramsB * 1e9 * BYTES[p]) / 1e9; }
export function kvBytesPerToken(m: ModelSpec): number { return 2 * m.layers * m.kvHeads * m.headDim * 2; }
export function kvGb(m: ModelSpec, context: number, concurrency: number): number {
  return (kvBytesPerToken(m) * context * concurrency) / 1e9;
}

export interface VramPlan { weights: number; kv: number; overhead: number; total: number; usable: number; fits: boolean; maxConcurrency: number }

export function planVram(m: ModelSpec, gpuGb: number, p: Precision, context: number, concurrency: number,
                         tp = 1, utilisation = 0.9, overhead = 1.5): VramPlan {
  const weights = weightsGb(m, p);
  const kv = kvGb(m, context, concurrency);
  const usable = gpuGb * utilisation * tp;
  const total = weights + kv + overhead * tp;
  const perSeq = kvGb(m, context, 1);
  const maxConcurrency = Math.max(0, Math.floor((usable - weights - overhead * tp) / perSeq));
  return { weights, kv, overhead: overhead * tp, total, usable, fits: total <= usable, maxConcurrency };
}

export function minTensorParallel(m: ModelSpec, inst: Instance, p: Precision, context: number, concurrency: number): number | null {
  for (let tp = 1; tp <= inst.gpus; tp *= 2) if (planVram(m, inst.memoryGb, p, context, concurrency, tp).fits) return tp;
  return null;
}

// ---- bin-packing (first-fit decreasing), same rules as gpuplan/binpack.py ----
export type ShareMode = "exclusive" | "time-slicing" | "mig";
export interface Workload { name: string; memoryGb: number; replicas: number }
export interface Slot { capacity: number; used: number; tenants: { name: string; gb: number }[]; slicesLeft: number }
export interface Packing { nodes: Slot[][]; unplaced: string[]; gpusUsed: number; utilisation: number; hourly: number }

const MIG_PROFILES: [string, number][] = [["1g.5gb", 5], ["2g.10gb", 10], ["3g.20gb", 20], ["7g.40gb", 40]];

export function pack(workloads: Workload[], inst: Instance, mode: ShareMode, slices = 4): Packing {
  if (mode === "mig" && !inst.mig) throw new Error(`${inst.gpu} does not support MIG`);
  const items = workloads.flatMap(w => Array.from({ length: w.replicas }, () => ({ name: w.name, gb: w.memoryGb })))
    .sort((a, b) => b.gb - a.gb);
  const nodes: Slot[][] = [];
  const unplaced: string[] = [];
  const budget = mode === "time-slicing" ? slices : mode === "mig" ? 7 : 1;
  for (const item of items) {
    let gb = item.gb, cost = 1;
    if (mode === "mig") {
      const prof = MIG_PROFILES.find(([, mem]) => mem >= item.gb);
      if (!prof) { unplaced.push(item.name); continue; }
      gb = prof[1];
      cost = parseInt(prof[0], 10);
    } else if (item.gb > inst.memoryGb) { unplaced.push(item.name); continue; }
    const fits = (s: Slot) => mode === "exclusive" ? s.tenants.length === 0 : s.used + gb <= s.capacity + 1e-9 && s.slicesLeft >= cost;
    let slot = nodes.flat().find(fits);
    if (!slot) {
      if (nodes.length >= 40) { unplaced.push(item.name); continue; }
      const node = Array.from({ length: inst.gpus }, () => ({ capacity: inst.memoryGb, used: 0, tenants: [], slicesLeft: budget } as Slot));
      nodes.push(node);
      slot = node.find(fits);
      if (!slot) { unplaced.push(item.name); continue; }
    }
    slot.used += gb;
    slot.slicesLeft -= cost;
    slot.tenants.push({ name: item.name, gb });
  }
  const all = nodes.flat();
  const cap = all.reduce((a, s) => a + s.capacity, 0);
  return {
    nodes, unplaced,
    gpusUsed: all.filter(s => s.tenants.length).length,
    utilisation: cap ? all.reduce((a, s) => a + s.used, 0) / cap : 0,
    hourly: nodes.length * inst.hourly
  };
}

// ---- queueing model: closed loop of `concurrency` clients against `slots` batch slots ----
// Matches the mock vLLM server used in gpu-inference-k8s/results/bench-mock.json.
export interface QueuePoint { concurrency: number; throughput: number; ttft: number; latency: number }

export function queuePoint(concurrency: number, slots: number, perStreamTps: number, baseTtft: number, tokensPerRequest: number): QueuePoint {
  const service = baseTtft + tokensPerRequest / perStreamTps;
  if (concurrency <= slots) {
    return { concurrency, throughput: (concurrency * tokensPerRequest) / service, ttft: baseTtft, latency: service };
  }
  const latency = (concurrency / slots) * service;
  return { concurrency, throughput: (slots * tokensPerRequest) / service, ttft: latency - tokensPerRequest / perStreamTps, latency };
}

export function costPerMillionTokens(hourly: number, tokensPerSecond: number): number {
  if (tokensPerSecond <= 0) return Infinity;
  return (hourly / (tokensPerSecond * 3600)) * 1e6;
}

export function monthlyCost(hourly: number, activeHoursPerDay: number, scaleToZero: boolean): number {
  return hourly * (scaleToZero ? activeHoursPerDay : 24) * 30;
}

// Committed output of gpu-inference-k8s bench/loadtest.py against the mock server.
export const realMockBench = [
  { concurrency: 1, ttft: 0.0604, latency: 1.0529, throughput: 30.32 },
  { concurrency: 4, ttft: 0.0603, latency: 1.0511, throughput: 120.86 },
  { concurrency: 8, ttft: 1.1054, latency: 2.0987, throughput: 121.22 }
] as const;
