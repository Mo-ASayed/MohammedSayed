"use client";

import { useState } from "react";

export function Flow({ steps, label }: { steps: { name: string; tag: string; detail: string }[]; label: string }) {
  const [active, setActive] = useState<number | null>(null);
  return (
    <figure style={{ margin: 0 }}>
      <div className="pl-flow" role="group" aria-label={label}>
        {steps.map((s, i) => (
          <button key={s.name} type="button" aria-pressed={active === i} onClick={() => setActive(i)}>
            <small>{String(i + 1).padStart(2, "0")} · {s.tag}</small>{s.name}
          </button>
        ))}
      </div>
      <figcaption className="pl-flow-detail" aria-live="polite">
        {active === null ? "Select a stage to see what happens there and which file implements it." : steps[active].detail}
      </figcaption>
    </figure>
  );
}
