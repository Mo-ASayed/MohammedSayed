"use client";

import { useCallback, useState, type ComponentType, type ReactNode } from "react";

type ButtonComponent = ComponentType<{
  children: ReactNode;
  href?: string;
}>;

export function ProgressiveSpecularLink({ children, href }: { children: ReactNode; href: string }) {
  const [Button, setButton] = useState<ButtonComponent | null>(null);
  const activate = useCallback(() => {
    if (Button) return;
    import("./SpecularButton").then((module) => setButton(() => module.SpecularButton));
  }, [Button]);

  if (Button) return <Button href={href}>{children}</Button>;
  return <a className="specular-button specular-button--md progressive-specular" href={href} onPointerEnter={activate} onFocus={activate}><span className="specular-button__label">{children}</span></a>;
}
