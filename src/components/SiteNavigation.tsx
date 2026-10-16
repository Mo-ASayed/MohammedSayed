"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useRef } from "react";
import { navItems } from "../app/data";

export function SiteNavigation() {
  const menu = useRef<HTMLDetailsElement>(null);
  const close = () => { if (menu.current) menu.current.open = false; };
  const links = <>{navItems.map(item => <Link key={item.label} href={item.href} onClick={close}>{item.label}</Link>)}<a href="/apricot">Learn</a></>;
  return <>
    <nav className="top-nav" aria-label="Primary navigation">{links}</nav>
    <details className="mobile-navigation" ref={menu} onKeyDown={event => {
      if (event.key === "Escape") { close(); menu.current?.querySelector("summary")?.focus(); }
    }}>
      <summary aria-label="Site menu"><Menu className="menu-open-icon" size={20} /><X className="menu-close-icon" size={20} /></summary>
      <nav aria-label="Mobile navigation">{links}</nav>
    </details>
  </>;
}
