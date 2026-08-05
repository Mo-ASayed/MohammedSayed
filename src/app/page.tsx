import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Download,
  Github,
  Linkedin,
  Mail,
  Plane,
} from "lucide-react";
import { A380Scene } from "../components/A380Scene";
import { experience, profile, projects, stack } from "./data";

const signals = [
  { value: "6+ years", label: "production engineering" },
  { value: "AWS + Azure", label: "cloud platforms" },
  { value: "Kubernetes", label: "Terraform · GitOps" },
  { value: "1,000+", label: "engineers supported" },
];

const interests = ["Aviation", "Aerospace systems", "Developer tooling", "Mentoring", "Reliable infrastructure"];

export default function Home() {
  return (
    <main className="portfolio-home">
      <div className="aircraft-flight-layer"><A380Scene /></div>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-stage">
          <div className="hero-grid" aria-hidden="true" />

          <div className="hero-shell">
            <div className="hero-copy">
              <p className="kicker"><span /> Senior DevOps &amp; Platform Engineer · London</p>
              <h1 id="hero-title">Cloud platforms.<br /><em>Engineered to hold.</em></h1>
              <p className="hero-summary">
                I&apos;m Mohammed Sayed. I build secure cloud foundations, delivery systems and
                production operations that stay understandable when the pressure is on.
              </p>
              <div className="hero-actions">
                <a className="button button-primary" href="#work">See the evidence <ArrowDownRight size={18} /></a>
                <a className="button button-ghost" href={profile.cvFile} download><Download size={17} /> Download CV</a>
              </div>
              <div className="hero-links" aria-label="Professional profiles">
                <a href={profile.github} target="_blank" rel="noreferrer"><Github size={18} /> GitHub <ArrowUpRight size={14} /></a>
                <a href={profile.linkedin} target="_blank" rel="noreferrer"><Linkedin size={18} /> LinkedIn <ArrowUpRight size={14} /></a>
              </div>
            </div>

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
            <p className="section-label">01 / The engineer</p>
            <h2>Precision is more than an aesthetic.</h2>
          </div>
          <div className="story-copy">
            <p className="story-lead">
              My route into infrastructure started with an Aerospace Engineering degree.
              Aviation taught me to admire systems where reliability, feedback and clear
              operating decisions are non-negotiable.
            </p>
            <p>
              Today I apply that mindset across AWS, Azure, Kubernetes, Terraform and CI/CD.
              I&apos;ve led cloud migration work, improved infrastructure cost and delivery,
              hardened more than 100 repositories, and supported over 1,000 engineers learning the craft.
            </p>
            <div className="interest-list" aria-label="Interests and passions">
              {interests.map((interest) => <span key={interest}>{interest}</span>)}
            </div>
          </div>
        </div>
      </section>

      <section className="work section" id="work">
        <div className="section-shell">
          <div className="section-intro">
            <div>
              <p className="section-label">02 / Selected work</p>
              <h2>Proof, not a wall of logos.</h2>
            </div>
            <p>Four projects chosen to show range: platform engineering, developer experience, cloud security and architecture.</p>
          </div>

          <div className="project-list">
            {projects.map((project, index) => {
              const Icon = project.icon;
              return (
                <article className="project" key={project.title}>
                  <div className="project-index">0{index + 1}</div>
                  <div className="project-icon"><Icon size={28} strokeWidth={1.6} aria-hidden="true" /></div>
                  <div className="project-body">
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
          <a className="all-work" href={profile.github} target="_blank" rel="noreferrer">
            Explore all 17 public repositories <ArrowRight size={17} />
          </a>
        </div>
      </section>

      <section className="experience-section section" id="experience">
        <div className="section-shell experience-grid">
          <div className="experience-heading">
            <p className="section-label">03 / Experience</p>
            <h2>Built in production.<br />Shared in public.</h2>
            <p>Six years across cloud platforms, delivery engineering and technical education.</p>
            <Link className="inline-link" href="/cv">Read the full CV <ArrowRight size={16} /></Link>
          </div>
          <div className="experience-list">
            {experience.map((item, index) => (
              <article className="experience-item" key={`${item.company}-${item.role}`}>
                <span className="experience-number">0{index + 1}</span>
                <div><h3>{item.role}</h3><p>{item.company}</p></div>
                <time>{item.period.replace("01/", "").replace("02/", "")}</time>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="principles section" id="approach">
        <div className="section-shell">
          <p className="section-label">04 / How I work</p>
          <div className="principle-grid">
            <article><span>01</span><h3>Make the safe path the easy path.</h3><p>Guardrails, reusable modules and automated checks should help teams move faster—not add theatre.</p></article>
            <article><span>02</span><h3>Optimise for the operator.</h3><p>A platform is only good if the people deploying, debugging and recovering it can understand what it is doing.</p></article>
            <article><span>03</span><h3>Measure what changed.</h3><p>Cost, lead time, reliability and recovery tell a stronger engineering story than the number of tools involved.</p></article>
          </div>
          <div className="stack-line"><span>Working stack</span><div>{stack.slice(0, 14).map((item) => <small key={item}>{item}</small>)}</div></div>
        </div>
      </section>

      <section className="contact" id="contact">
        <div className="contact-radar" aria-hidden="true"><Plane size={34} /></div>
        <div className="section-shell contact-grid">
          <div><p className="section-label">05 / Contact</p><h2>Let&apos;s build something<br /><em>that holds.</em></h2></div>
          <div className="contact-copy">
            <p>For senior DevOps, platform engineering and cloud infrastructure opportunities.</p>
            <a className="contact-link" href={`mailto:${profile.email}`}><Mail size={20} /> {profile.email} <ArrowUpRight size={18} /></a>
            <div><a href={profile.linkedin}>LinkedIn</a><a href={profile.github}>GitHub</a><Link href="/cv">CV</Link></div>
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
