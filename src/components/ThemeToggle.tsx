"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useLayoutEffect, useState } from "react";

type Theme = "light" | "dark";

// The inline script in layout.tsx sets html[data-theme] before paint, but this
// component still has to render "light" first to match the server-rendered HTML.
// useLayoutEffect corrects the icon before the browser paints, so there's no
// flash; a plain useEffect would run after paint and the icon would visibly flip.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useIsomorphicLayoutEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    setTheme(next);
    try {
      window.localStorage.setItem("portfolio-theme", next);
    } catch {
      // The current-page preference still works when browser storage is blocked.
    }
  };

  return (
    <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}>
      {theme === "light" ? <Moon size={16} aria-hidden="true" /> : <Sun size={16} aria-hidden="true" />}
    </button>
  );
}
