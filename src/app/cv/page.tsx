import type { Metadata } from "next";
import { Download, Mail, MapPin, Phone } from "lucide-react";
import { cvProjects, education, experience, profile, skillGroups, summary } from "../data";

export const metadata: Metadata = {
  title: "CV",
  description: "CV for Mohammed Sayed, Senior DevOps Engineer."
};

export default function CvPage() {
  return (
    <main className="subpage">
      <section className="cv-hero">
        <div>
          <p className="eyebrow">Curriculum vitae</p>
          <h1>{profile.name}</h1>
          <p>{profile.role}</p>
        </div>
        <div className="cv-actions">
          <a className="button primary" href={profile.cvFile} download>
            <Download size={18} aria-hidden="true" />
            Download CV
          </a>
          <a className="button secondary" href={`mailto:${profile.email}`}>
            <Mail size={18} aria-hidden="true" />
            Email
          </a>
        </div>
      </section>

      <section className="cv-layout">
        <aside className="cv-sidebar">
          <div>
            <h2>Contact</h2>
            <p>
              <Mail size={15} aria-hidden="true" /> {profile.email}
            </p>
            <p>
              <Phone size={15} aria-hidden="true" /> {profile.phone}
            </p>
            <p>
              <MapPin size={15} aria-hidden="true" /> {profile.location}
            </p>
          </div>
          <div>
            <h2>Profiles</h2>
            <a href={profile.linkedin}>LinkedIn</a>
            <a href={profile.github}>GitHub</a>
            <a href={profile.medium}>Tech Blog</a>
          </div>
          <div>
            <h2>Education</h2>
            {education.map((item) => (
              <p key={item.institution}>
                {item.degree}, {item.institution}
              </p>
            ))}
          </div>
          <div className="skill-groups">
            <h2>Skills</h2>
            {skillGroups.map((group) => (
              <div className="skill-group" key={group.category}>
                <p className="skill-group-label">{group.category}</p>
                <div className="mini-stack">
                  {group.items.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <div className="cv-main">
          <section>
            <h2>Profile</h2>
            <p>{summary}</p>
          </section>

          <section>
            <h2>Experience</h2>
            {experience.map((item) => (
              <article className="timeline-item" key={`${item.company}-${item.role}`}>
                <div>
                  <h3>{item.role}</h3>
                  <p>{item.company}</p>
                </div>
                <span>{item.period}</span>
                <ul>
                  {item.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </section>

          <section>
            <h2>Project Highlights</h2>
            <ul className="cv-bullets">
              {cvProjects.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>
      </section>
    </main>
  );
}
