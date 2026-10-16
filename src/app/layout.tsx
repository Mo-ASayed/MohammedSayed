import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { ThemeToggle } from "../components/ThemeToggle";
import { profile } from "./data";
import { SiteNavigation } from "../components/SiteNavigation";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://mohammedsayed.com"),
  title: { default: `${profile.name} | Platform & DevOps Engineer`, template: `%s | ${profile.name}` },
  description: "Mohammed Sayed is a London-based Senior DevOps and Platform Engineer building reliable cloud foundations, delivery systems, and production operations.",
  keywords: [
    "DevOps Engineer London",
    "Platform Engineer",
    "AWS",
    "Azure",
    "Kubernetes",
    "Terraform",
    "Site Reliability Engineering"
  ],
  authors: [{ name: profile.name, url: "https://mohammedsayed.com" }],
  creator: profile.name,
  alternates: { canonical: "https://mohammedsayed.com" },
  openGraph: {
    title: `${profile.name} | Platform & DevOps Engineer`,
    description: "Production outcomes, selected platform engineering work, cloud infrastructure, and delivery systems.",
    url: "https://mohammedsayed.com",
    siteName: profile.name,
    locale: "en_GB",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: `${profile.name} | Platform & DevOps Engineer`,
    description: "Production outcomes, selected platform engineering work, cloud infrastructure, and delivery systems."
  },
  robots: { index: true, follow: true }
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f3ef" },
    { media: "(prefers-color-scheme: dark)", color: "#07141d" }
  ],
  colorScheme: "light dark"
};

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  jobTitle: profile.role,
  url: "https://mohammedsayed.com",
  worksFor: { "@type": "Organization", name: profile.company },
  address: { "@type": "PostalAddress", addressLocality: "London", addressCountry: "GB" },
  alumniOf: { "@type": "CollegeOrUniversity", name: "Brunel University" },
  knowsAbout: ["AWS", "Azure", "Kubernetes", "Terraform", "CI/CD", "Observability", "Cloud Security"],
  sameAs: [profile.github, profile.linkedin, profile.medium]
};

const themeScript = `try{document.documentElement.dataset.theme=localStorage.getItem('portfolio-theme')==='dark'?'dark':'light'}catch{document.documentElement.dataset.theme='light'}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
      </head>
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <header className="site-header">
          <Link className="brand" href="/" aria-label="Mohammed Sayed home"><span className="brand-mark">MS</span><span>{profile.domain}</span></Link>
          <div className="header-actions">
            <SiteNavigation />
            <ThemeToggle />
          </div>
        </header>
        {children}
        <footer className="site-footer"><span>{profile.name}</span><span>{profile.role}</span><div><a href={profile.github}>GitHub</a><a href={profile.linkedin}>LinkedIn</a></div></footer>
      </body>
    </html>
  );
}
