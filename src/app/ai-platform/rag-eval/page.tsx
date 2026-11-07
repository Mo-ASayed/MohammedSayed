import type { Metadata } from "next";
import { Flow } from "../../../components/platform/Flow";
import { ProjectHeader } from "../../../components/platform/ProjectHeader";
import { Quiz } from "../../../components/platform/Quiz";
import { RagLab } from "../../../components/platform/RagLab";
import { platformProjects, ragQuiz } from "../content";

const project = platformProjects[2];

export const metadata: Metadata = {
  title: "RAG with an eval gate",
  description: "Retrieval-augmented generation with pgvector and LangChain, a golden-set evaluation gate in CI and an MLflow model registry, with real evaluation charts and a self-test.",
  alternates: { canonical: "https://mohammedsayed.com/ai-platform/rag-eval" }
};

const steps = [
  { name: "Chunk", tag: "rag/documents.py", detail: "Pack whole paragraphs up to N words and split oversized ones with overlap. Every chunk carries doc id, title and status (current or superseded) as metadata." },
  { name: "Embed + store", tag: "rag/store.py", detail: "pgvector with an HNSW cosine index, or in-memory for CI. The offline embedder is a hashed TF-IDF stand-in. Titan and Azure text-embedding-3-small plug in behind the same interface." },
  { name: "Retrieve", tag: "rag/retriever.py", detail: "A LangChain BaseRetriever: embed the query, take the top-k with a status filter in the same SQL query, and return Documents with scores. Bedrock Knowledge Bases and Azure AI Search (hybrid) retrievers return the same shape." },
  { name: "Answer or abstain", tag: "rag/pipeline.py", detail: "If the best chunk scores below the floor, say 'I can't answer that from the indexed documents.' Otherwise generate: extractive offline, or an LLM through the gateway with a cite-or-abstain prompt." },
  { name: "Evaluate", tag: "evaluation/", detail: "29 golden questions, 4 of them deliberately unanswerable. Measures hit rate, MRR, context precision, answer accuracy, faithfulness, abstention accuracy and false-abstention rate." },
  { name: "Gate + register", tag: "evaluation/run.py", detail: "Absolute thresholds plus no regression of more than 0.05 against the champion. A pass logs a pyfunc model to the MLflow registry and moves the champion alias. A fail exits 1 and blocks the merge in CI." }
];

export default function RagEvalPage() {
  return (
    <main className="subpage platform" id="main">
      <ProjectHeader eyebrow="AI platform project 03" repo={project.repo} tags={project.tags}
        title={<>A RAG change is <em>a release.</em></>}
        lede="Chunk size, k, a similarity floor or a new embedding model can each quietly break answers. This project treats every one of them as a release candidate that has to pass an evaluation gate." />
      <div className="pl-wrap">
        <section className="pl-section">
          <h2>Pipeline and gate</h2>
          <Flow steps={steps} label="RAG and evaluation stages" />
        </section>
        <section className="pl-section">
          <h2>Real evaluation results</h2>
          <p>All three views use the committed results in <code>results/</code>. The top two are real runs; the third is a hands-on drill on the same metrics.</p>
          <RagLab />
        </section>
        <section className="pl-section" id="test-me">
          <h2>Test me</h2>
          <Quiz id="rag-eval" title="RAG and the eval gate" questions={ragQuiz} />
        </section>
        <section className="pl-section">
          <h2>Run it yourself</h2>
          <p>Free: <code>pytest -q</code> (17 tests), then <code>python -m evaluation.run --config configs/candidate-bad.yaml</code> to watch the gate block it. <code>mlflow ui</code> shows the runs and registry. <code>docker compose</code> adds pgvector and an MLflow server. Optional Terraform creates a Bedrock Knowledge Base on Aurora pgvector and an Azure AI Search service. It is validated but has not been applied.</p>
        </section>
      </div>
    </main>
  );
}
