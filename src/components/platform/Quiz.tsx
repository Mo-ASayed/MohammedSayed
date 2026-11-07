"use client";

import { useEffect, useState } from "react";

export interface QuizQuestion {
  kind: "Concept" | "Scenario" | "Numbers";
  q: string;
  options: string[];
  answer: number;
  explain: string;
}

const key = (id: string) => `ai-platform-quiz-${id}`;

export function Quiz({ id, title, questions }: { id: string; title: string; questions: QuizQuestion[] }) {
  const [order, setOrder] = useState<number[] | null>(null);
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [best, setBest] = useState<number | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(key(id));
      if (saved !== null) setBest(Number(saved));
    } catch {
      // Storage blocked: the quiz still works, the best score just is not remembered.
    }
  }, [id]);

  const start = (subset?: number[]) => {
    setOrder(subset ?? questions.map((_, i) => i));
    setStep(0);
    setPicked(null);
    setResults([]);
  };

  if (!order) {
    return (
      <div className="pl-quiz" id={`quiz-${id}`}>
        <div className="pl-quiz-head">
          <strong>{title}</strong>
          <span>{questions.length} questions{best !== null ? ` · best ${best}/${questions.length}` : ""}</span>
        </div>
        <p className="pl-sub" style={{ marginTop: 12 }}>
          Concept checks, scenario calls and numbers from the real runs. Answer, then read why. Wrong answers can be retried at the end.
        </p>
        <button className="pl-button" type="button" onClick={() => start()} data-testid="quiz-start">Test me</button>
      </div>
    );
  }

  const done = step >= order.length;
  if (done) {
    const score = results.filter(Boolean).length;
    const missed = order.filter((_, i) => !results[i]);
    return (
      <div className="pl-quiz" id={`quiz-${id}`}>
        <div className="pl-quiz-head"><strong>{title}</strong><span>finished</span></div>
        <h3 data-testid="quiz-score">{score} / {order.length} correct</h3>
        <p className="pl-sub">
          {score === order.length ? "Every answer correct. Try explaining each one out loud without the options." :
            "Re-read the explanations for the ones you missed, then retry just those."}
        </p>
        <div className="pl-quiz-actions">
          {missed.length > 0 && <button className="pl-button" type="button" onClick={() => start(missed)}>Retry the {missed.length} I missed</button>}
          <button className="pl-button ghost" type="button" onClick={() => start()}>Start again</button>
        </div>
      </div>
    );
  }

  const qi = order[step];
  const q = questions[qi];
  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const next = [...results, i === q.answer];
    setResults(next);
    if (step === order.length - 1 && order.length === questions.length) {
      const score = next.filter(Boolean).length;
      if (best === null || score > best) {
        setBest(score);
        try { window.localStorage.setItem(key(id), String(score)); } catch { /* storage blocked */ }
      }
    }
  };

  return (
    <div className="pl-quiz" id={`quiz-${id}`}>
      <div className="pl-quiz-head">
        <strong>{title}</strong>
        <span>{step + 1} / {order.length} · {results.filter(Boolean).length} correct</span>
      </div>
      <h3><span className="pl-kind">{q.kind}</span><br />{q.q}</h3>
      <div className="pl-options" role="group" aria-label="Answer options">
        {q.options.map((o, i) => (
          <button key={o} type="button" disabled={picked !== null}
                  className={picked === null ? "" : i === q.answer ? "correct" : i === picked ? "wrong" : ""}
                  aria-pressed={picked === i} onClick={() => choose(i)}>{o}</button>
        ))}
      </div>
      {picked !== null && (
        <>
          <p className="pl-explain" role="status" data-testid="quiz-feedback">
            <strong className={picked === q.answer ? "pl-good" : "pl-bad"}>{picked === q.answer ? "Correct." : "Not quite."}</strong>{" "}
            {q.explain}
          </p>
          <button className="pl-button" type="button" onClick={() => { setStep(step + 1); setPicked(null); }}>
            {step === order.length - 1 ? "See my score" : "Next question"}
          </button>
        </>
      )}
    </div>
  );
}
