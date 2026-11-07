import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

export function ProjectHeader({ eyebrow, title, lede, repo, tags }:
  { eyebrow: string; title: React.ReactNode; lede: string; repo: string; tags: readonly string[] }) {
  return (
    <section className="page-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{lede}</p>
      <div className="pl-chips">{tags.map(t => <span key={t}>{t}</span>)}</div>
      <div className="pl-links">
        <a className="primary" href={repo} target="_blank" rel="noreferrer">Source on GitHub <ExternalLink size={15} aria-hidden="true" /></a>
        <a href="#test-me">Test me</a>
        <Link href="/ai-platform"><ArrowLeft size={15} aria-hidden="true" /> All AI platform projects</Link>
      </div>
    </section>
  );
}
