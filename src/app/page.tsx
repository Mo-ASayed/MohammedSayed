import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Github,
  Linkedin,
} from "lucide-react";
import { ContactForm } from "../components/ContactForm";
import { FlightPath } from "../components/FlightPath";
import { experience, profile, projects } from "./data";

const signals = [
  { value: "6+ years", label: "production engineering" },
  { value: "AWS + Azure", label: "cloud platforms" },
  { value: "Kubernetes", label: "Terraform · GitOps" },
  { value: "1,000+", label: "engineers supported" },
];

export default function Home() {
  return (
    <main className="portfolio-home" id="main">
      <FlightPath />
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-stage">
          <div className="hero-grid" aria-hidden="true" />

          <div className="hero-shell">
            <div className="hero-copy">
              <p className="kicker"><span /> Senior DevOps &amp; Platform Engineer · London</p>
              <h1 id="hero-title">Mohammed Sayed.<br /><em>Platform engineer.</em></h1>
              <p className="hero-summary">
                I build cloud infrastructure and the tools teams use to ship software.
                Based in London, with a background in aerospace and a growing interest in AI.
              </p>
              <div className="hero-actions">
                <a className="button button-primary" href="#work">Explore my work <ArrowDownRight size={18} /></a>
                <a className="button button-ghost" href="#contact">Get in touch <ArrowRight size={17} /></a>
              </div>
              <div className="hero-links" aria-label="Professional profiles">
                <a href={profile.github} target="_blank" rel="noreferrer"><Github size={18} /> GitHub <ArrowUpRight size={14} /></a>
                <a href={profile.linkedin} target="_blank" rel="noreferrer"><Linkedin size={18} /> LinkedIn <ArrowUpRight size={14} /></a>
              </div>
            </div>

            <aside className="profile-now" aria-label="What I am working on">
              <span className="now-label">A little context</span>
              <div><span>Working</span><strong>Senior DevOps Engineer</strong><p>Osprey Flight Solutions</p></div>
              <div><span>Making</span><a href="/apricot">Apricot, my visual AI notebook <ArrowUpRight size={16} /></a></div>
              <div><span>Writing</span><a href={profile.medium} target="_blank" rel="noreferrer">Notes from building things <ArrowUpRight size={16} /></a></div>
            </aside>

          </div>

          <div className="signal-strip">
            <div className="signal-inner">
              {signals.map((item) => (
                <div className="signal-item" key={item.value}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="story section" id="about">
        <div className="section-shell story-grid">
          <div>
            <p className="section-label">01 / About me</p>
            <h2>From aerospace to infrastructure.</h2>
          </div>
          <div className="story-copy">
            <p className="story-lead">
              I moved from Aerospace Engineering into DevOps, bringing the same focus on
              reliable systems and clear operating decisions. Today I build cloud platforms
              that make the safe path easier for engineering teams.
            </p>
          </div>
        </div>
      </section>

      <section className="work section" id="work">
        <div className="section-shell">
          <div className="section-intro">
            <div>
              <p className="section-label">02 / Selected work</p>
              <h2>Things I&apos;ve built.</h2>
            </div>
            <p>Open-source tools and hands-on infrastructure projects. The code is there to explore.</p>
          </div>

          <div className="project-list">
            {projects.map((project, index) => {
              const Icon = project.icon;
              return (
                <article className={`project${index < 2 ? " project-featured" : ""}`} key={project.title}>
                  <div className="project-index">0{index + 1}</div>
                  <div className="project-icon"><Icon size={28} strokeWidth={1.6} aria-hidden="true" /></div>
                  <div className="project-body">
                    {index < 2 && <div className={`project-preview preview-${index}`}>
                      <span className="preview-caption">{index === 0 ? "DockerForge / workflow" : "EKS platform / delivery path"}</span>
                      {index === 0 ? <div className="forge-preview"><code>Project source</code><ArrowRight size={18} aria-hidden="true" /><code>DockerForge</code><ArrowRight size={18} aria-hidden="true" /><code>Dockerfile</code><p>Stack detection <span>/</span> Secure defaults <span>/</span> CI linting</p></div> : <div className="platform-preview"><div><span>Terraform</span><small>Provision</small></div><ArrowRight size={18} aria-hidden="true" /><div><span>Argo CD</span><small>Deliver</small></div><ArrowRight size={18} aria-hidden="true" /><div><span>Amazon EKS</span><small>9 Go services</small></div></div>}
                    </div>}
                    <div className="project-meta"><span>{project.status}</span><span>{project.scope}</span></div>
                    <h3>{project.title}</h3>
                    <p>{project.description}</p>
                    <strong className="project-proof">{project.proof}</strong>
                    <div className="project-tags">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                  </div>
                  <div className="project-links">
                    {project.links.map((link) => (
                      <a href={link.href} key={link.label} target="_blank" rel="noreferrer">
                        {link.label} <ArrowUpRight size={16} />
                      </a>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
          <a className="all-work" href="/projects">
            Explore all projects <ArrowRight size={17} />
          </a>
        </div>
      </section>

      <section className="section apricot-feature" id="learn" aria-labelledby="apricot-title">
        <div className="section-shell apricot-feature-inner">
          <div>
            <p className="section-label">Side project / Learning in public</p>
            <h2 id="apricot-title">Apricot</h2>
            <span className="apricot-edition">Learning by moving things.</span>
            <p className="apricot-description">I learn best when I can see what changes. Apricot is where I explore
              models, language and retrieval through small visual experiments.</p>
            <a className="button apricot-link" href="/apricot"><span>Have a look around</span><ArrowRight size={17} aria-hidden="true" /></a>
            <p className="apricot-detail">A work in progress, with notes along the way.</p>
          </div>
          <a className="apricot-preview" href="/apricot#rag" aria-label="Open the interactive RAG map in Apricot">
            <div className="preview-browser"><span /><span /><span /><small>Inside Apricot / the retrieval map</small></div>
            <img src="/images/apricot-map.webp" width="1000" height="760" loading="lazy" alt="Apricot's retrieval map with draggable passages, a question marker and a search radius." />
            <span className="preview-link">Move a question. Watch the evidence change. <ArrowUpRight size={18} /></span>
          </a>
        </div>
      </section>

      <section className="experience-section section" id="experience">
        <div className="section-shell experience-grid">
          <div className="experience-heading">
            <p className="section-label">03 / Experience</p>
            <h2>Where I&apos;ve worked.</h2>
            <p>Six years across cloud platforms, delivery engineering and technical education.</p>
            <a className="inline-link" href="#contact">Talk about my experience <ArrowRight size={16} /></a>
          </div>
          <div className="experience-list">
            {experience.map((item, index) => (
              <article className="experience-item" key={`${item.company}-${item.role}`}>
                <span className="experience-number">0{index + 1}</span>
                <div className="experience-details">
                  <h3>{item.role}</h3>
                  <p>{item.company}</p>
                  <p className="experience-outcome">{item.points[0]}</p>
                  <details className="experience-more"><summary>More about this role</summary><ul>{item.points.slice(1).map(point => <li key={point}>{point}</li>)}</ul></details>
                  <div className="experience-tools" aria-label={`Tools used at ${item.company}`}>
                    {item.tools.map((tool) => <span key={tool}>{tool}</span>)}
                  </div>
                </div>
                <span className="experience-period">{item.period.replace(/\b(?:01|02)\//g, "")}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="contact" id="contact">
        <div className="section-shell contact-grid">
          <div><p className="section-label">04 / Contact</p><h2>Have something<br /><em>in mind?</em></h2></div>
          <div className="contact-copy">
            <p>
              For engineering roles, project questions or a conversation about something here, send me a note.
            </p>
            <ContactForm />
            <div>
              <a href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
              <a href={profile.github} target="_blank" rel="noreferrer">GitHub</a>
              <a href={profile.medium} target="_blank" rel="noreferrer">Tech blog</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/*
  PRIVATE PORTFOLIO ROADMAP — intentionally not rendered on the website.
  1. Add one strong recommendation from a manager or senior engineer, with permission.
  2. Add verified certification badges only when they support the roles being targeted
     (CKA/CKAD, Terraform Associate, or an advanced AWS/Azure certification).
  3. Turn the EKS platform and DockerForge into full case studies with architecture diagrams,
     key decisions, trade-offs, test evidence, and a short demo video.
  4. Publish two or three opinionated technical articles based on real lessons learned.
  5. Keep GitHub READMEs consistent: problem, architecture, decisions, verification, demo.
  6. Add an anonymised recommendation or hiring-manager quote to strengthen social proof.
*/
