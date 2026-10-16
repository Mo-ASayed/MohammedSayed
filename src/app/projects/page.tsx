import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { projects } from "../data";

export const metadata: Metadata = {
  title: "Projects",
  description: "Selected projects by Mohammed Sayed across DevOps, Kubernetes, AWS, and platform engineering.",
  alternates: { canonical: "https://mohammedsayed.com/projects" }
};

export default function ProjectsPage() {
  return (
    <main className="subpage" id="main">
      <section className="page-heading">
        <p className="eyebrow">Projects</p>
        <h1>From architecture<br />to working systems.</h1>
        <p>
          Open source tools and hands-on platform projects. Explore the code, the
          engineering decisions and the systems behind them.
        </p>
      </section>

      <section className="project-grid">
        {projects.map((project) => {
          const Icon = project.icon;
          return (
            <article className="project-card" key={project.title}>
              <div className="project-card-top">
                <Icon size={24} aria-hidden="true" />
                <span>{project.status}</span>
              </div>
              <h2>{project.title}</h2>
              <p>{project.description}</p>
              <p className="project-card-proof">{project.proof}</p>
              <div className="tag-row">
                {project.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <a className="text-link" href={project.href} target="_blank" rel="noreferrer" aria-label={`View ${project.title} on GitHub (opens in a new tab)`}>
                View repository <ExternalLink size={17} aria-hidden="true" />
              </a>
            </article>
          );
        })}
      </section>
    </main>
  );
}
