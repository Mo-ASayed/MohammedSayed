"use client";

import { useMemo, useState } from "react";
import {
  costPerMillionTokens, INSTANCES, minTensorParallel, MODELS, monthlyCost, pack, planVram, queuePoint, realMockBench,
  type Precision, type ShareMode, type Workload
} from "../../lib/platform/gpu";

const PALETTE = ["var(--pl-teal)", "var(--pl-accent)", "var(--pl-warn)", "var(--pl-good)", "var(--pl-bad)"];

function Range({ id, label, value, min, max, step = 1, show, onChange }:
  { id: string; label: string; value: number; min: number; max: number; step?: number; show?: string; onChange: (v: number) => void }) {
  return (
    <label htmlFor={id}>
      <span>{label}<output htmlFor={id}>{show ?? value}</output></span>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} />
    </label>
  );
}

function VramFit() {
  const [modelId, setModel] = useState("llama-3.1-8b");
  const [precision, setPrecision] = useState<Precision>("bf16");
  const [instId, setInst] = useState("g6.xlarge");
  const [ctxPow, setCtxPow] = useState(13);
  const [conc, setConc] = useState(3);
  const model = MODELS.find(m => m.id === modelId)!;
  const inst = INSTANCES.find(i => i.id === instId)!;
  const context = 2 ** ctxPow;
  const tp = minTensorParallel(model, inst, precision, context, conc);
  const plan = planVram(model, inst.memoryGb, precision, context, conc, tp ?? 1);
  const scaleMax = Math.max(plan.total, plan.usable, inst.memoryGb * (tp ?? 1)) * 1.05;
  const x = (gb: number) => 10 + (gb / scaleMax) * 680;

  return (
    <div className="pl-lab" data-testid="vram-lab">
      <div className="pl-visual">
        <h3>Will it fit, and how many requests can it batch?</h3>
        <p className="pl-sub">GPU memory = weights + KV cache (grows with context × concurrent sequences) + runtime overhead. vLLM claims 90% of the card up front.</p>
        <svg className="pl-chart" viewBox="0 0 700 120" role="img"
             aria-label={`Needs ${plan.total.toFixed(1)} GB of ${plan.usable.toFixed(1)} GB usable; ${plan.fits ? "fits" : "does not fit"}`}>
          <rect x={x(0)} y={30} width={x(plan.weights) - x(0)} height={34} fill="var(--pl-teal)" />
          <rect x={x(plan.weights)} y={30} width={x(plan.weights + plan.kv) - x(plan.weights)} height={34} fill="var(--pl-accent)" />
          <rect x={x(plan.weights + plan.kv)} y={30} width={x(plan.total) - x(plan.weights + plan.kv)} height={34} fill="var(--pl-quiet)" />
          <line x1={x(plan.usable)} x2={x(plan.usable)} y1={16} y2={78} stroke="var(--pl-ink)" strokeWidth={2} strokeDasharray="4 3" />
          <text x={x(plan.usable)} y={12} textAnchor="middle">usable {plan.usable.toFixed(1)} GB</text>
          <text x={10} y={96}>weights {plan.weights.toFixed(1)} GB · KV {plan.kv.toFixed(1)} GB · overhead {plan.overhead.toFixed(1)} GB</text>
          <text x={10} y={114}>total {plan.total.toFixed(1)} GB</text>
        </svg>
        <div className="pl-legend"><span><i style={{ background: "var(--pl-teal)" }} />weights</span><span><i style={{ background: "var(--pl-accent)" }} />KV cache</span><span><i style={{ background: "var(--pl-quiet)" }} />overhead</span></div>
        <div className={`pl-verdict ${plan.fits && tp ? "pass" : "fail"}`} data-testid="vram-verdict" aria-live="polite">
          {tp === null
            ? `Does not fit even across all ${inst.gpus} GPU(s) of a ${inst.id}. Quantise, cut context or concurrency, or pick bigger GPUs.`
            : `${plan.fits ? "Fits" : "Does not fit"} with tensor parallel = ${tp}. At ${context.toLocaleString()} tokens of context this card holds at most ${plan.maxConcurrency} full-length sequence${plan.maxConcurrency === 1 ? "" : "s"} at once.`}
        </div>
      </div>
      <div className="pl-controls">
        <label htmlFor="vr-model"><span>Model</span>
          <select id="vr-model" value={modelId} onChange={e => setModel(e.target.value)}>{MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}</select>
        </label>
        <label htmlFor="vr-inst"><span>Instance</span>
          <select id="vr-inst" value={instId} onChange={e => setInst(e.target.value)}>{INSTANCES.map(i => <option key={i.id} value={i.id}>{i.id} · {i.gpu}</option>)}</select>
        </label>
        <div className="pl-segment" role="group" aria-label="Weight precision">
          {(["bf16", "fp8", "int8", "int4"] as Precision[]).map(pr => <button key={pr} type="button" aria-pressed={precision === pr} onClick={() => setPrecision(pr)}>{pr}</button>)}
        </div>
        <Range id="vr-ctx" label="Context length" value={ctxPow} min={10} max={15} show={`${context.toLocaleString()} tokens`} onChange={setCtxPow} />
        <Range id="vr-conc" label="Concurrent sequences" value={conc} min={1} max={64} onChange={setConc} />
        <p className="pl-sub">KV per token for {model.label}: 2 × {model.layers} layers × {model.kvHeads} KV heads × {model.headDim} × 2 bytes.</p>
      </div>
    </div>
  );
}

const MIXES: Record<string, Workload[]> = {
  "Mixed fleet": [
    { name: "embedder 1.5B", memoryGb: 4, replicas: 3 },
    { name: "8B int4", memoryGb: 8, replicas: 2 },
    { name: "8B bf16", memoryGb: 20, replicas: 1 }
  ],
  "Many small models": [{ name: "small", memoryGb: 3, replicas: 8 }],
  "Two big replicas": [{ name: "8B bf16", memoryGb: 20, replicas: 2 }]
};

function Packing() {
  const [mixName, setMix] = useState("Mixed fleet");
  const [mode, setMode] = useState<ShareMode>("exclusive");
  const [instId, setInst] = useState("g6.xlarge");
  const [hours, setHours] = useState(10);
  const inst = INSTANCES.find(i => i.id === instId)!;
  const effectiveMode: ShareMode = mode === "mig" && !inst.mig ? "exclusive" : mode;
  const mix = MIXES[mixName];
  const result = useMemo(() => pack(mix, inst, effectiveMode), [mix, inst, effectiveMode]);
  const names = [...new Set(mix.map(w => w.name))];

  return (
    <div className="pl-lab" data-testid="pack-lab">
      <div className="pl-visual">
        <h3>Bin-packing replicas onto GPUs</h3>
        <p className="pl-sub">First-fit decreasing, the same algorithm as <code>gpuplan/binpack.py</code>. Each column is one GPU; its height is GPU memory.</p>
        <div className="pl-nodes" aria-label={`${result.nodes.length} nodes, ${result.gpusUsed} GPUs in use`}>
          {result.nodes.map((node, ni) => (
            <div className="pl-node" key={ni}>
              <small>node {ni + 1} · {inst.id}</small>
              <div className="pl-gpus">
                {node.map((g, gi) => (
                  <div className={`pl-gpu ${inst.gpus === 1 ? "single" : ""}`} key={gi} title={`${g.used} / ${g.capacity} GB`}>
                    {g.tenants.map((t, ti) => (
                      <span key={ti} style={{ height: `${(t.gb / g.capacity) * 100}%`, background: PALETTE[names.indexOf(t.name) % PALETTE.length] }} title={`${t.name} ${t.gb} GB`} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="pl-legend">{names.map((n, i) => <span key={n}><i style={{ background: PALETTE[i % PALETTE.length] }} />{n}</span>)}</div>
        <div className="pl-tiles" data-testid="pack-tiles" aria-live="polite">
          <div><span>Nodes</span><strong>{result.nodes.length}</strong></div>
          <div><span>GPUs in use</span><strong>{result.gpusUsed}</strong></div>
          <div><span>Memory used</span><strong>{Math.round(result.utilisation * 100)}%</strong></div>
          <div><span>$/hour (list)</span><strong>{result.hourly.toFixed(2)}</strong></div>
          <div><span>$/month always on</span><strong>{Math.round(monthlyCost(result.hourly, hours, false)).toLocaleString()}</strong></div>
          <div><span>$/month scale-to-zero</span><strong>{Math.round(monthlyCost(result.hourly, hours, true)).toLocaleString()}</strong></div>
        </div>
        {result.unplaced.length > 0 && <div className="pl-verdict fail">Could not place: {result.unplaced.join(", ")}</div>}
        {mode === "time-slicing" && <div className="pl-verdict fail">Time-slicing shares memory with no isolation. One tenant can OOM the others. The packer keeps memory under the card size because nothing else will.</div>}
        {mode === "mig" && !inst.mig && <div className="pl-verdict fail">{inst.gpu} has no MIG support. Showing exclusive packing. Pick the p4d (A100) to see MIG.</div>}
      </div>
      <div className="pl-controls">
        <div className="pl-segment" role="group" aria-label="Workload mix">
          {Object.keys(MIXES).map(m => <button key={m} type="button" aria-pressed={mixName === m} onClick={() => setMix(m)}>{m}</button>)}
        </div>
        <div className="pl-segment" role="group" aria-label="GPU sharing mode">
          {(["exclusive", "time-slicing", "mig"] as ShareMode[]).map(m => <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)} data-testid={`mode-${m}`}>{m === "mig" ? "MIG" : m}</button>)}
        </div>
        <label htmlFor="pk-inst"><span>Instance</span>
          <select id="pk-inst" value={instId} onChange={e => setInst(e.target.value)}>{INSTANCES.map(i => <option key={i.id} value={i.id}>{i.id} · {i.gpu}</option>)}</select>
        </label>
        <Range id="pk-hours" label="Hours per day with traffic" value={hours} min={1} max={24} onChange={setHours} />
        <p className="pl-sub">Scale-to-zero pays only for active hours, but the first request after idle waits for a node launch, an image pull and a model load.</p>
      </div>
    </div>
  );
}

function CostLatency() {
  const [slots, setSlots] = useState(4);
  const [tps, setTps] = useState(30);
  const [tokens, setTokens] = useState(32);
  const [instId, setInst] = useState("g6.xlarge");
  const inst = INSTANCES.find(i => i.id === instId)!;
  const levels = [1, 2, 4, 8, 16, 32, 64];
  const pts = levels.map(c => {
    const q = queuePoint(c, slots, tps, 0.05, tokens);
    return { ...q, cost: costPerMillionTokens(inst.hourly, q.throughput) };
  });
  const knee = { ...queuePoint(slots, slots, tps, 0.05, tokens) };
  const kneeCost = costPerMillionTokens(inst.hourly, knee.throughput);
  const maxLat = Math.max(...pts.map(p => p.latency)) * 1.1;
  const maxCost = Math.max(...pts.map(p => p.cost)) * 1.1;
  const X = (c: number) => 80 + (Math.log2(c) / 6) * 580;
  const Yc = (v: number) => 140 - (v / maxCost) * 115;
  const Yl = (v: number) => 310 - (v / maxLat) * 115;

  return (
    <div className="pl-lab" data-testid="cost-lab">
      <div className="pl-visual">
        <h3>Cost per million tokens vs latency</h3>
        <p className="pl-sub">More concurrent requests share the same GPU-hour, so cost per token falls. Once every batch slot is busy, extra requests only queue. Cost stops improving while latency keeps climbing.</p>
        <svg className="pl-chart" viewBox="0 0 700 350" role="img" aria-label={`Cost per million tokens falls from ${pts[0].cost.toFixed(2)} to ${kneeCost.toFixed(2)} dollars at ${slots} concurrent requests and then stays flat, while latency rises from ${pts[0].latency.toFixed(1)} to ${pts[pts.length - 1].latency.toFixed(1)} seconds`}>
          <text x={88} y={16}>$ per 1M output tokens</text>
          <path className="axis" d="M80 25V140H670" />
          {[0.5, 1].map(f => <g key={f}><path className="grid" d={`M80 ${Yc(maxCost * f)}H670`} /><text x={72} y={Yc(maxCost * f) + 5} textAnchor="end">${(maxCost * f).toFixed(2)}</text></g>)}
          <path d={pts.map((p, i) => `${i ? "L" : "M"}${X(p.concurrency)} ${Yc(p.cost)}`).join("")} fill="none" stroke="var(--pl-accent)" strokeWidth={2.5} />
          {pts.map(p => <circle key={p.concurrency} cx={X(p.concurrency)} cy={Yc(p.cost)} r={4.5} fill="var(--pl-accent)" />)}
          <text x={88} y={186}>request latency (s)</text>
          <path className="axis" d="M80 195V310H670" />
          {[0.5, 1].map(f => <g key={f}><path className="grid" d={`M80 ${Yl(maxLat * f)}H670`} /><text x={72} y={Yl(maxLat * f) + 5} textAnchor="end">{(maxLat * f).toFixed(1)}</text></g>)}
          <path d={pts.map((p, i) => `${i ? "L" : "M"}${X(p.concurrency)} ${Yl(p.latency)}`).join("")} fill="none" stroke="var(--pl-teal)" strokeWidth={2.5} />
          <path d={pts.map((p, i) => `${i ? "L" : "M"}${X(p.concurrency)} ${Yl(p.ttft)}`).join("")} fill="none" stroke="var(--pl-bad)" strokeWidth={2} strokeDasharray="6 4" />
          {pts.map(p => <circle key={p.concurrency} cx={X(p.concurrency)} cy={Yl(p.latency)} r={4.5} fill="var(--pl-teal)" />)}
          {pts.map(p => <text key={p.concurrency} x={X(p.concurrency)} y={332} textAnchor="middle">{p.concurrency}</text>)}
          <text x={375} y={349} textAnchor="middle">concurrent requests (log scale)</text>
          <path d={`M${X(slots)} 25V310`} stroke="var(--pl-ink)" strokeDasharray="3 4" />
          <text x={X(slots) + 6} y={40}>{slots} slots full</text>
        </svg>
        <div className="pl-legend"><span><i style={{ background: "var(--pl-accent)" }} />cost per 1M tokens</span><span><i style={{ background: "var(--pl-teal)" }} />p50 latency</span><span><i style={{ background: "var(--pl-bad)" }} />time to first token</span></div>
        <details className="pl-details">
          <summary>Real benchmark this model is calibrated on (mock server, not a GPU)</summary>
          <div className="pl-table-wrap">
            <table className="pl-table">
              <thead><tr><th>concurrency</th><th>TTFT p50</th><th>latency p50</th><th>tokens/s</th></tr></thead>
              <tbody>{realMockBench.map(r => <tr key={r.concurrency}><td className="num">{r.concurrency}</td><td className="num">{r.ttft.toFixed(2)} s</td><td className="num">{r.latency.toFixed(2)} s</td><td className="num">{r.throughput.toFixed(0)}</td></tr>)}</tbody>
            </table>
          </div>
          <p className="pl-sub">From <code>bench/loadtest.py</code> against the mock vLLM server (4 slots, 40 tok/s per stream). Real GPU numbers need a real run. The repo claims none.</p>
        </details>
      </div>
      <div className="pl-controls">
        <Range id="cl-slots" label="Batch slots (--max-num-seqs, memory-limited)" value={slots} min={1} max={32} onChange={setSlots} />
        <Range id="cl-tps" label="Per-stream tokens/s (measure it)" value={tps} min={5} max={120} onChange={setTps} />
        <Range id="cl-tokens" label="Output tokens per request" value={tokens} min={16} max={512} step={16} onChange={setTokens} />
        <label htmlFor="cl-inst"><span>Instance price</span>
          <select id="cl-inst" value={instId} onChange={e => setInst(e.target.value)}>{INSTANCES.map(i => <option key={i.id} value={i.id}>{i.id} · ${i.hourly}/h</option>)}</select>
        </label>
        <p className="pl-sub" data-testid="cost-knee">At the knee ({slots} concurrent): {knee.throughput.toFixed(0)} tokens/s, ${kneeCost.toFixed(2)} per 1M tokens, {knee.latency.toFixed(2)} s per request.</p>
      </div>
    </div>
  );
}

export function GpuLab() {
  return <><VramFit /><Packing /><CostLatency /></>;
}
