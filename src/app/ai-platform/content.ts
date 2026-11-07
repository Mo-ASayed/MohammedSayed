import type { QuizQuestion } from "../../components/platform/Quiz";

const GH = "https://github.com/Mo-ASayed";

export const platformProjects = [
  {
    slug: "llm-gateway",
    title: "Multi-cloud LLM gateway",
    repo: `${GH}/llm-gateway`,
    blurb: "One OpenAI-shaped endpoint in front of Amazon Bedrock and Azure OpenAI. It handles per-team keys, rate limits, token quotas, daily budgets, cost per request and circuit-breaker failover.",
    proof: "36 tests · failover simulation through the real gateway code · Terraform for Bedrock Guardrails and Azure OpenAI + APIM (validated, not applied)",
    tags: ["Bedrock", "Azure OpenAI", "APIM", "FastAPI", "Prometheus"]
  },
  {
    slug: "gpu-inference",
    title: "GPU inference on EKS",
    repo: `${GH}/gpu-inference-k8s`,
    blurb: "A capacity planner (VRAM, bin-packing under exclusive, time-slicing and MIG, cost), plus Karpenter GPU NodePools, the NVIDIA GPU Operator, vLLM and KEDA scale-to-zero manifests.",
    proof: "18 tests · manifest policy checks · streaming load test · mock vLLM for kind · no GPU numbers claimed",
    tags: ["Karpenter", "GPU Operator", "vLLM", "KEDA", "Spot"]
  },
  {
    slug: "rag-eval",
    title: "RAG with an eval gate",
    repo: `${GH}/rag-eval-platform`,
    blurb: "RAG over runbooks with pgvector and a LangChain retriever. A 29-question golden set and a CI gate block bad releases. MLflow tracks every run and promotes the champion.",
    proof: "17 tests · 4 configs evaluated (2 blocked, 2 promoted) · threshold sweep · Bedrock KB and Azure AI Search retrievers",
    tags: ["pgvector", "LangChain", "MLflow", "Bedrock KB", "Azure AI Search"]
  }
] as const;

export const skillMatrix: [string, string, string, string][] = [
  ["Bedrock: invocation, Guardrails, Knowledge Bases, cost per request", "Converse, guardrailConfig, cost", "-", "KB retriever + Terraform"],
  ["Azure OpenAI / AI Foundry: deployments, TPM, content filters, AI Search", "deployments, 429s, filters, APIM", "-", "AI Search hybrid retriever"],
  ["API gateway in front of LLMs: auth, limits, quotas, failover", "core of the project", "cold-start fallback", "generator calls the gateway"],
  ["GPUs on Kubernetes: operator, Karpenter, spot, time-slicing/MIG, scale to zero", "-", "core of the project", "-"],
  ["RAG with a real vector store and LangChain", "-", "-", "pgvector + BaseRetriever"],
  ["MLflow registry + eval gate in CI", "-", "-", "core of the project"],
  ["LLM observability: latency, tokens, cost, dashboards", "Prometheus + Grafana + alerts", "vLLM + DCGM metrics", "retrieval-quality metrics"]
];

export const gatewayQuiz: QuizQuestion[] = [
  { kind: "Scenario", q: "Bedrock returns a Guardrail intervention for a prompt. Azure OpenAI is healthy. What should the gateway do?",
    options: ["Retry the prompt on Azure OpenAI", "Return 400 to the caller and count it as blocked", "Open the Bedrock circuit breaker", "Retry Bedrock with temperature 0"],
    answer: 1, explain: "A safety refusal is a policy decision, not an outage. Sending the same prompt to a second vendor bypasses your own control. The breaker is not tripped either, because Bedrock answered correctly." },
  { kind: "Concept", q: "In Azure OpenAI, what does `capacity: 10` on a GlobalStandard deployment mean?",
    options: ["10 requests per second", "10,000 tokens per minute of quota for that deployment", "10 concurrent connections", "10 provisioned throughput units"],
    answer: 1, explain: "For Standard and GlobalStandard SKUs, one capacity unit is 1,000 TPM. Azure derives an RPM limit from it. Exceeding it returns 429 with a retry-after header, which the gateway treats as retryable." },
  { kind: "Scenario", q: "The gateway runs 3 replicas behind a load balancer. The batch team has a 10 RPM limit. Roughly what limit is actually enforced?",
    options: ["10 RPM", "About 30 RPM, because each pod has its own in-memory bucket", "3 RPM", "Unlimited"],
    answer: 1, explain: "Limiter state is per process, so each pod enforces 10. Either keep one replica, move counters to Redis, or let APIM's azure-openai-token-limit enforce it centrally. The Helm values say this explicitly." },
  { kind: "Concept", q: "Why does a 400 ValidationException from Bedrock NOT count as a breaker failure?",
    options: ["Breakers only count timeouts", "It means the request is malformed, not that the provider is unhealthy", "Bedrock never returns 400", "To save cost"],
    answer: 1, explain: "Breakers protect against unhealthy providers. A bad request fails the same way everywhere. Counting it would open the circuit and push good traffic to the fallback for no reason." },
  { kind: "Numbers", q: "In the committed simulation, Bedrock failed for requests 60-119 with a breaker threshold of 3. How many calls reached Bedrock during that outage?",
    options: ["60", "30", "3", "0"],
    answer: 2, explain: "Three consecutive failures opened the circuit at t≈31 s. The 30 s cooldown ended after the outage, so the half-open trial at t=61 s succeeded and traffic returned to Bedrock. The rest of the outage went straight to Azure." },
  { kind: "Concept", q: "Before calling a provider the limiter reserves `prompt_chars/4 + max_tokens`. Why reserve, then settle?",
    options: ["Providers bill the reservation", "Concurrent requests would otherwise all pass the TPM check before any reports usage", "To make responses faster", "Because tokenisers are identical across vendors"],
    answer: 1, explain: "Usage is only known after the call. Reserving an upper-bound estimate stops a burst from overshooting the TPM window. Settling replaces it with the provider-reported tokens, and a failed call releases it." },
  { kind: "Scenario", q: "Finance asks why the search team's LLM bill doubled last week, with no change in request count. Which metric do you look at first?",
    options: ["llm_gateway_requests_total by status", "llm_gateway_tokens_total by team and direction, then served-by target", "Pod CPU usage", "Circuit breaker state"],
    answer: 1, explain: "Same requests with higher cost means more tokens per request (longer prompts or outputs) or a pricier target. A failover period moves traffic between price tables. Tokens by direction plus served-by target separates the two causes." },
  { kind: "Concept", q: "Which IAM action lets the gateway call a Bedrock model through the Converse API?",
    options: ["bedrock:Converse", "bedrock:InvokeModel on the foundation-model ARN", "bedrock-runtime:*", "sagemaker:InvokeEndpoint"],
    answer: 1, explain: "Converse is authorised by bedrock:InvokeModel (and InvokeModelWithResponseStream for streaming), scoped to specific foundation-model ARNs. Guardrails additionally need bedrock:ApplyGuardrail on the guardrail ARN." }
];

export const gpuQuiz: QuizQuestion[] = [
  { kind: "Numbers", q: "Llama 3.1 8B in bf16 on a 24 GB L4 with vLLM at 0.9 utilisation and 8k context. Roughly how many full-length sequences fit at once?",
    options: ["About 3", "About 16", "About 64", "It does not fit at all"],
    answer: 0, explain: "Weights take ~16 GB and overhead ~1.5 GB, leaving ~4 GB of a 21.6 GB budget. At 131,072 bytes per token, one 8k sequence is ~1.07 GB of KV cache, so 3 fit. int4 weights would free room for 10+." },
  { kind: "Concept", q: "Why does the GPU NodePool carry a `nvidia.com/gpu=true:NoSchedule` taint?",
    options: ["The device plugin requires it", "So ordinary pods never land on expensive GPU nodes and keep them from consolidating", "To enable MIG", "Karpenter cannot launch GPU nodes otherwise"],
    answer: 1, explain: "Without the taint, a stray DaemonSet-free deployment can schedule onto a GPU node. The node then never empties, so scale-to-zero never happens. GPU pods carry the matching toleration." },
  { kind: "Scenario", q: "Dev teams want to share one A10G between four small models. What do you warn them about with time-slicing?",
    options: ["It needs MIG-capable hardware", "There is no memory isolation, so one pod can OOM the others", "It disables CUDA", "Each pod gets a quarter of the memory"],
    answer: 1, explain: "Time-slicing interleaves compute but every pod sees the full memory. Nothing stops one tenant allocating it all. MIG (A100/H100) gives hardware-isolated memory and compute slices instead." },
  { kind: "Concept", q: "Why scale vLLM on queue depth (num_requests_waiting/running) instead of CPU?",
    options: ["CPU metrics are not exported", "LLM serving is GPU- and memory-bound, so CPU barely moves while requests queue", "KEDA cannot read CPU", "Queue depth is cheaper to store"],
    answer: 1, explain: "The container's CPU stays low even when the GPU is saturated. Requests waiting for a batch slot is the direct signal that latency is about to grow." },
  { kind: "Scenario", q: "With minReplicaCount 0, a request arrives after 2 idle hours. What has to happen before the first token?",
    options: ["Nothing, the pod is cached", "A GPU node launches, the multi-GB image pulls, and the model loads into GPU memory", "Only the model reloads", "KEDA answers the request itself"],
    answer: 1, explain: "That chain takes minutes. Callers need a queue, a retry, or a hosted fallback (the gateway can route to Bedrock or Azure meanwhile). Also, with zero pods there are no vLLM metrics, so wake-up needs a signal from in front, such as the KEDA HTTP add-on or a gateway metric." },
  { kind: "Numbers", q: "In the mock benchmark (4 batch slots), going from 4 to 8 concurrent requests changed aggregate throughput how?",
    options: ["It doubled", "It stayed ~121 tokens/s while TTFT rose from 0.06 s to 1.1 s", "It halved", "TTFT fell"],
    answer: 1, explain: "Past the slot limit, extra requests only queue. On a real vLLM server the slot count is bounded by --max-num-seqs and the KV-cache memory left after weights. Those numbers come from the mock, not a GPU." },
  { kind: "Concept", q: "Llama 3.1 70B in bf16 at 8k × 8. Minimum tensor-parallel degree on A100-40GB?",
    options: ["1", "2", "4", "8"],
    answer: 3, explain: "Weights alone are ~141 GB. Four A100-40GB give 144 GB usable at 0.9, which leaves no room for KV cache or overhead. So it needs TP=8 (a whole p4d). On H100-80GB, TP=4 is enough." },
  { kind: "Scenario", q: "Spot GPU capacity gets interrupted. What in the manifests limits the damage?",
    options: ["Nothing, spot is unsafe for inference", "Karpenter handles the 2-minute notice and falls back to on-demand, the disruption budget allows 1 node at a time, and terminationGracePeriod lets in-flight generations finish", "The GPU Operator migrates the model", "MIG"],
    answer: 1, explain: "The NodePool allows spot and on-demand and drains on interruption notices. The budget caps simultaneous disruption. Graceful termination plus multiple replicas, or a gateway fallback, absorb the rest." }
];

export const ragQuiz: QuizQuestion[] = [
  { kind: "Numbers", q: "candidate-loose had the best answer accuracy on the list (0.96). Why was it blocked?",
    options: ["Latency was too high", "It answered 2 of 4 unanswerable questions (abstention accuracy 0.50)", "Hit rate fell", "MLflow was down"],
    answer: 1, explain: "Lowering the floor to 0.08 let weak matches through, so the pipeline answered questions the corpus cannot answer. Gating on accuracy alone would have shipped a hallucinating assistant." },
  { kind: "Concept", q: "What does the no-regression rule add on top of absolute thresholds?",
    options: ["Nothing", "It blocks candidates that pass thresholds but are more than 0.05 worse than the current champion on any gated metric", "It re-trains the model", "It lowers thresholds over time"],
    answer: 1, explain: "Thresholds stop disasters. The regression rule stops slow decay, for example re-submitting the old baseline after v2 raised answer accuracy to 0.96." },
  { kind: "Scenario", q: "candidate-bad answered “Thursday 17:00” for the change freeze. Root cause?",
    options: ["The embedder hallucinated", "Superseded documents were included and the 2024 Jenkins runbook ranked first with k=1", "The golden set was wrong", "pgvector returned random rows"],
    answer: 1, explain: "Retrieval found a real but stale document. Store status/version metadata with each chunk and filter at query time. The retriever's include_superseded flag defaults to false." },
  { kind: "Concept", q: "How do you roll back a bad RAG release in this setup?",
    options: ["Rebuild the image from the previous commit", "Move the MLflow `champion` alias back to the previous model version", "Delete the vector index", "Restore Postgres from backup"],
    answer: 1, explain: "Serving loads models:/rag-platform-assistant@champion. Each version bundles its config and corpus, so moving the alias is an instant rollback with no rebuild." },
  { kind: "Concept", q: "You switch from the hashing embedder to Titan embeddings. What else must happen?",
    options: ["Nothing", "Re-embed and re-index the whole corpus, then re-run the eval gate", "Only re-embed new documents", "Lower the thresholds"],
    answer: 1, explain: "Vectors from different models live in different spaces and are not comparable. The embedder is a release setting: re-index everything and treat it as a new candidate." },
  { kind: "Concept", q: "Why is faithfulness 1.0 for every config in these results?",
    options: ["The pipeline is perfect", "The offline generator is extractive: it can only quote retrieved text", "The metric is broken", "The golden set has no answers"],
    answer: 1, explain: "Faithfulness measures how much of the answer is supported by the context. An extractive generator cannot invent words. The metric starts to bite when an LLM generator (through the gateway) is plugged in." },
  { kind: "Scenario", q: "In production you have no labels. Which signal best warns that a re-index broke retrieval?",
    options: ["HTTP 5xx rate", "A shift down in the rag_retrieval_top_score distribution and a rise in abstentions", "CPU usage", "Request count"],
    answer: 1, explain: "Answer accuracy needs labels, which you don't have live. Top similarity score and abstention rate are cheap proxies that move immediately when retrieval degrades." },
  { kind: "Concept", q: "Why does the Bedrock Knowledge Base Terraform use Aurora pgvector instead of the console's default OpenSearch Serverless?",
    options: ["OpenSearch is not supported", "OpenSearch Serverless has a standing minimum charge, a classic surprise bill for a demo KB", "Aurora is faster for every workload", "Bedrock requires Postgres"],
    answer: 1, explain: "Serverless OpenSearch bills minimum capacity around the clock. Aurora Serverless v2 scales to a small floor and matches the pgvector engine used locally. OpenSearch still makes sense for large hybrid search at scale." }
];
