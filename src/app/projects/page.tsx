import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { projects } from "../data";

export const metadata: Metadata = {
  title: "Projects",
  description: "Selected projects by Mohammed Sayed across DevOps, Kubernetes, AWS, and platform engineering."
};

export default function ProjectsPage() {
  return (
    <main className="subpage">
      <section className="page-heading">
        <p className="eyebrow">Projects</p>
        <h1>Infrastructure, platform, and cloud delivery work.</h1>
        <p>
          A curated view of public repositories and lab work. The main portfolio stays on
          Vercel; AWS demos can live independently under lab.mohammedsayed.com.
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
              <div className="tag-row">
                {project.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <a className="text-link" href={project.href}>
                Open project <ExternalLink size={17} aria-hidden="true" />
              </a>
            </article>
          );
        })}
      </section>
    </main>
  );
}
