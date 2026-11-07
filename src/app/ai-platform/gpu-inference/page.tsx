import type { Metadata } from "next";
import { Flow } from "../../../components/platform/Flow";
import { GpuLab } from "../../../components/platform/GpuLab";
import { ProjectHeader } from "../../../components/platform/ProjectHeader";
import { Quiz } from "../../../components/platform/Quiz";
import { gpuQuiz, platformProjects } from "../content";

const project = platformProjects[1];

export const metadata: Metadata = {
  title: "GPU inference on EKS",
  description: "Serving open LLMs on GPUs in Kubernetes: VRAM sizing, bin-packing with time-slicing and MIG, Karpenter spot GPU pools, vLLM and KEDA scale-to-zero, with interactive cost and latency charts.",
  alternates: { canonical: "https://mohammedsayed.com/ai-platform/gpu-inference" }
};

const steps = [
  { name: "Size it", tag: "gpuplan/vram.py", detail: "Weights (parameters × bytes) plus KV cache (2 × layers × KV heads × head dim × 2 bytes per token × context × concurrency) plus overhead, against 90% of the card. This tells you whether a model fits, its tensor-parallel degree, and how many sequences it can batch." },
  { name: "Provision", tag: "k8s/karpenter", detail: "A dedicated GPU NodePool for g6, g5 and g6e. Spot is allowed with on-demand fallback. It is tainted so only GPU pods land there, capped at 8 GPUs, and set to consolidate when empty or underused. Bottlerocket's NVIDIA variant ships the driver." },
  { name: "Expose GPUs", tag: "k8s/gpu-operator", detail: "The GPU Operator runs the device plugin (with a time-slicing config: 4 replicas per GPU), the DCGM exporter for GPU metrics, feature discovery labels, and the MIG manager for A100/H100." },
  { name: "Serve", tag: "k8s/vllm", detail: "vLLM's OpenAI-compatible server with nvidia.com/gpu: 1, a toleration, a startup probe sized for model load, /dev/shm, and graceful termination for spot notices." },
  { name: "Scale", tag: "k8s/keda", detail: "KEDA scales on vLLM's queue depth, from 0 to 4 replicas, with a 15-minute cooldown. Scale-from-zero needs a signal from in front of the model (the HTTP add-on or a gateway metric), because zero pods export no metrics." },
  { name: "Measure", tag: "bench/loadtest.py", detail: "A streaming load test reports TTFT, latency percentiles and aggregate tokens/s per concurrency level. The measured tokens/s is the only honest input to cost per million tokens." }
];

export default function GpuInferencePage() {
  return (
    <main className="subpage platform" id="main">
      <ProjectHeader eyebrow="AI platform project 02" repo={project.repo} tags={project.tags}
        title={<>GPUs that <em>turn themselves off.</em></>}
        lede="Self-hosted models are cheap only when the GPUs are busy and expensive when they idle. This project is the arithmetic and the Kubernetes wiring for keeping them busy, or off." />
      <div className="pl-wrap">
        <section className="pl-section">
          <h2>From model to running pod</h2>
          <Flow steps={steps} label="GPU serving stages" />
        </section>
        <section className="pl-section">
          <h2>Size, pack and price it</h2>
          <p>Browser ports of the repo&apos;s planner. Prices are illustrative on-demand list prices; pass your own spot discount in the CLI.</p>
          <GpuLab />
        </section>
        <section className="pl-section" id="test-me">
          <h2>Test me</h2>
          <Quiz id="gpu-inference" title="GPU inference on EKS" questions={gpuQuiz} />
        </section>
        <section className="pl-section">
          <h2>Run it yourself</h2>
          <p>Free: <code>pytest -q</code> (18 tests: planner maths, manifest policy rules, mock server and load test), <code>python -m gpuplan</code>, and a kind cluster running the mock vLLM with the same taints, labels and tolerations as the real Deployment. Real GPUs cost money: <code>terraform/</code> installs the GPU Operator and KEDA into an existing EKS cluster with Karpenter. It is validated but has not been applied.</p>
        </section>
      </div>
    </main>
  );
}
