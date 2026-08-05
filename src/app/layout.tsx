import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { ThemeToggle } from "../components/ThemeToggle";
import { navItems, profile } from "./data";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://mohammedsayed.com"),
  title: { default: `${profile.name} | Platform & DevOps Engineer`, template: `%s | ${profile.name}` },
  description: "Mohammed Sayed is a London-based Senior DevOps and Platform Engineer building reliable cloud foundations, delivery systems, and production operations.",
  openGraph: {
    title: `${profile.name} | Platform & DevOps Engineer`,
    description: "Production outcomes, selected platform engineering work, cloud infrastructure, and delivery systems.",
    url: "https://mohammedsayed.com",
    siteName: profile.name,
    type: "website"
  }
};

const themeScript = `try{document.documentElement.dataset.theme=localStorage.getItem('portfolio-theme')==='dark'?'dark':'light'}catch{document.documentElement.dataset.theme='light'}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>
        <header className="site-header">
          <Link className="brand" href="/" aria-label="Mohammed Sayed home"><span className="brand-mark">MS</span><span>{profile.domain}</span></Link>
          <div className="header-actions">
            <nav className="top-nav" aria-label="Primary navigation">
              {navItems.map((item) => <Link key={item.label} href={item.href}>{item.label}</Link>)}
            </nav>
            <ThemeToggle />
          </div>
        </header>
        {children}
        <footer className="site-footer"><span>{profile.name}</span><span>{profile.role}</span><div><a href={profile.github}>GitHub</a><a href={profile.linkedin}>LinkedIn</a></div></footer>
      </body>
    </html>
  );
}
