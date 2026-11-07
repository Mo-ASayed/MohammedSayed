import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { platformProjects, skillMatrix } from "./content";

export const metadata: Metadata = {
  title: "AI platform projects",
  description: "Three runnable AI platform projects: a multi-cloud LLM gateway, GPU inference on EKS, and RAG with an evaluation gate and MLflow. Each has interactive visuals and a self-test.",
  alternates: { canonical: "https://mohammedsayed.com/ai-platform" }
};

export default function AiPlatformIndex() {
  return (
    <main className="subpage platform" id="main">
      <section className="page-heading">
        <p className="eyebrow">AI platform engineering</p>
        <h1>The platform under <em>the model.</em></h1>
        <p>
          Three projects that rebuild, in the open, the kind of AI platform work I do with Amazon Bedrock and Azure AI Foundry.
          Each one runs locally for free against mocks, kind or docker-compose. Each one has an interactive lab and a
          &ldquo;test me&rdquo; quiz, so I can check I can defend every decision.
        </p>
      </section>
      <div className="pl-wrap">
        <div className="pl-cards">
          {platformProjects.map(p => (
            <article className="pl-card" key={p.slug}>
              <div className="pl-chips" style={{ marginTop: 0 }}>{p.tags.slice(0, 3).map(t => <span key={t}>{t}</span>)}</div>
              <h2>{p.title}</h2>
              <p>{p.blurb}</p>
              <p style={{ fontSize: ".8rem" }}>{p.proof}</p>
              <div className="pl-links">
                <Link className="primary" href={`/ai-platform/${p.slug}`}>Explore and test me <ArrowRight size={15} aria-hidden="true" /></Link>
                <a href={p.repo} target="_blank" rel="noreferrer" aria-label={`${p.title} source on GitHub (opens in a new tab)`}>Code <ExternalLink size={14} aria-hidden="true" /></a>
              </div>
            </article>
          ))}
        </div>

        <section className="pl-section" style={{ marginTop: 56 }}>
          <h2>Which project proves which skill</h2>
          <p>The skills AI-platform job posts ask for most often, mapped to where each one is exercised in code.</p>
          <div className="pl-table-wrap">
            <table className="pl-table pl-matrix">
              <thead><tr><th>Skill</th><th>LLM gateway</th><th>GPU inference</th><th>RAG + eval</th></tr></thead>
              <tbody>{skillMatrix.map(([skill, a, b, c]) => <tr key={skill}><td>{skill}</td><td>{a}</td><td>{b}</td><td>{c}</td></tr>)}</tbody>
            </table>
          </div>
          <p className="pl-note">
            <strong>Honesty rule.</strong> Every number on these pages comes from a committed run: a gateway simulation with mock
            providers, a load test against a mock vLLM server, and evaluations of four RAG configs. Mock numbers are labelled as mock.
            Prices are illustrative list prices. No GPU benchmark is claimed. The cloud Terraform passes <code>terraform validate</code> and
            has not been applied.
          </p>
        </section>
      </div>
    </main>
  );
}
