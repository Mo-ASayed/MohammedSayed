"use client";

import { useState } from "react";
import { CONFIG_RESULTS, contextPrecision, gate, hitAtK, reciprocalRank, SWEEP, sweepGate, THRESHOLDS } from "../../lib/platform/rag";

const SERIES = [
  { idx: 1, name: "answer accuracy", color: "var(--pl-teal)", threshold: THRESHOLDS.answer_accuracy },
  { idx: 2, name: "abstention accuracy", color: "var(--pl-accent)", threshold: THRESHOLDS.abstention_accuracy },
  { idx: 3, name: "false abstention rate", color: "var(--pl-bad)", threshold: THRESHOLDS.false_abstention_rate }
];

function Sweep() {
  const [i, setI] = useState(2);
  const g = sweepGate(i);
  const X = (f: number) => 50 + (f / 0.2) * 600;
  const Y = (v: number) => 230 - v * 200;
  const [floor, acc, abst, fa] = SWEEP[i];
  return (
    <div className="pl-lab" data-testid="sweep-lab">
      <div className="pl-visual">
        <h3>Where should the abstention floor sit?</h3>
        <p className="pl-sub">Real sweep from <code>python -m evaluation.sweep</code>: the tuned config re-evaluated at 11 floors. Below the floor the pipeline says &ldquo;I can&apos;t answer that&rdquo;. Dashed lines are the gate thresholds.</p>
        <svg className="pl-chart" viewBox="0 0 680 270" role="img" aria-label={`At floor ${floor}: answer accuracy ${acc}, abstention accuracy ${abst}, false abstention ${fa}. Gate ${g.passed ? "passes" : "fails"}.`}>
          <path className="axis" d="M50 20V230H660" />
          {[0, 0.25, 0.5, 0.75, 1].map(v => <g key={v}><path className="grid" d={`M50 ${Y(v)}H660`} /><text x={44} y={Y(v) + 4} textAnchor="end">{v}</text></g>)}
          {SWEEP.map(([f]) => <text key={f} x={X(f)} y={248} textAnchor="middle">{f.toFixed(2)}</text>)}
          <text x={355} y={266} textAnchor="middle">min_score floor</text>
          <rect x={X(0.1) - 6} y={20} width={X(0.14) - X(0.1) + 12} height={210} fill="var(--pl-good)" opacity={0.1} />
          {SERIES.map(s => (
            <g key={s.name}>
              <path d={`M50 ${Y(s.threshold)}H660`} stroke={s.color} strokeDasharray="5 4" opacity={0.6} />
              <path d={SWEEP.map((p, k) => `${k ? "L" : "M"}${X(p[0])} ${Y(p[s.idx])}`).join("")} fill="none" stroke={s.color} strokeWidth={2.5} />
              {SWEEP.map(p => <circle key={p[0]} cx={X(p[0])} cy={Y(p[s.idx])} r={3.5} fill={s.color} />)}
            </g>
          ))}
          <path d={`M${X(floor)} 20V230`} stroke="var(--pl-ink)" strokeWidth={2} />
        </svg>
        <div className="pl-legend">{SERIES.map(s => <span key={s.name}><i style={{ background: s.color }} />{s.name}</span>)}<span><i style={{ background: "var(--pl-good)", opacity: .3 }} />gate passes</span></div>
      </div>
      <div className="pl-controls">
        <label htmlFor="sw-floor"><span>Abstention floor<output htmlFor="sw-floor">{floor.toFixed(2)}</output></span>
          <input id="sw-floor" type="range" min={0} max={SWEEP.length - 1} value={i} onChange={e => setI(Number(e.target.value))} />
        </label>
        <div className="pl-tiles">
          <div><span>Answer accuracy</span><strong>{acc.toFixed(2)}</strong></div>
          <div><span>Abstains correctly</span><strong>{abst.toFixed(2)}</strong></div>
          <div><span>Wrongly declines</span><strong>{fa.toFixed(2)}</strong></div>
        </div>
        <div className={`pl-verdict ${g.passed ? "pass" : "fail"}`} data-testid="sweep-verdict" aria-live="polite">
          <strong>{g.passed ? "Gate passes." : "Release blocked."}</strong>
          {!g.passed && <ul>{g.reasons.map(r => <li key={r}>{r}</li>)}</ul>}
        </div>
        <p className="pl-sub">Only 0.10 to 0.14 pass. That window rests on 4 unanswerable questions, and the sweep ran on the same golden set the gate uses. Treat it as a hint, then confirm on held-out questions.</p>
      </div>
    </div>
  );
}

const SHOW = ["hit_rate", "answer_accuracy", "abstention_accuracy", "false_abstention_rate"] as const;

function Configs() {
  const [champion, setChampion] = useState<number | null>(null);
  return (
    <div className="pl-lab" data-testid="config-lab">
      <div className="pl-visual">
        <h3>Four candidate configs through the gate</h3>
        <p className="pl-sub">Committed results from <code>python -m evaluation.run</code>, run in this order. A pass registers a new MLflow model version and moves the <code>champion</code> alias.</p>
        <svg className="pl-chart" viewBox="0 0 680 250" role="img" aria-label="Grouped bars of four metrics for four configs">
          <path className="axis" d="M40 15V205H670" />
          {[0, 0.5, 1].map(v => <g key={v}><path className="grid" d={`M40 ${205 - v * 180}H670`} /><text x={34} y={209 - v * 180} textAnchor="end">{v}</text></g>)}
          {CONFIG_RESULTS.map((c, ci) => {
            const gx = 52 + ci * 155;
            return (
              <g key={c.name}>
                {SHOW.map((m, mi) => {
                  const v = c.metrics[m];
                  const bad = m === "false_abstention_rate" ? v > THRESHOLDS[m] : v < THRESHOLDS[m];
                  return <g key={m}>
                    <rect x={gx + mi * 33} y={205 - v * 180} width={28} height={Math.max(v * 180, 1.5)} fill={SERIES_COLORS[mi]} opacity={bad ? 1 : 0.55} stroke={bad ? "var(--pl-bad)" : "none"} strokeWidth={2} />
                    <path d={`M${gx + mi * 33} ${205 - THRESHOLDS[m] * 180}h28`} stroke="var(--pl-ink)" strokeWidth={1.5} />
                  </g>;
                })}
                <text x={gx + 64} y={224} textAnchor="middle">{c.name}</text>
                <text x={gx + 64} y={241} textAnchor="middle" className={c.passed ? "pl-good" : "pl-bad"} style={{ fill: c.passed ? "var(--pl-good)" : "var(--pl-bad)" }}>{c.passed ? `pass → v${c.version}` : "blocked"}</text>
              </g>
            );
          })}
        </svg>
        <div className="pl-legend">{SHOW.map((m, i) => <span key={m}><i style={{ background: SERIES_COLORS[i] }} />{m.replaceAll("_", " ")}</span>)}<span>black tick = threshold · outlined = breach</span></div>
      </div>
      <div className="pl-controls">
        <span style={{ fontSize: ".82rem" }}>Also apply the no-regression rule against a champion:</span>
        <div className="pl-segment" role="group" aria-label="Champion">
          <button type="button" aria-pressed={champion === null} onClick={() => setChampion(null)}>thresholds only</button>
          <button type="button" aria-pressed={champion === 0} onClick={() => setChampion(0)}>baseline v1</button>
          <button type="button" aria-pressed={champion === 3} onClick={() => setChampion(3)} data-testid="champion-v2">tuned v2</button>
        </div>
        <div className="pl-table-wrap">
          <table className="pl-table compact" data-testid="config-table">
            <thead><tr><th>config</th><th>verdict</th></tr></thead>
            <tbody>
              {CONFIG_RESULTS.map((c, ci) => {
                const r = gate(c.metrics, THRESHOLDS, champion === null || champion === ci ? undefined : CONFIG_RESULTS[champion].metrics);
                return <tr key={c.name}><td><strong>{c.name}</strong><small style={{ display: "block", color: "var(--pl-muted)" }}>{c.summary}</small></td>
                  <td><span className={r.passed ? "pl-good" : "pl-bad"}>{r.passed ? "pass" : "blocked"}</span>{!r.passed && <small style={{ display: "block" }}>{r.reasons.slice(0, 2).join("; ")}{r.reasons.length > 2 ? ` (+${r.reasons.length - 2})` : ""}</small>}</td></tr>;
              })}
            </tbody>
          </table>
        </div>
        <p className="pl-sub">With v2 as champion, re-submitting the old baseline is blocked. Its answer accuracy is 0.08 lower, past the 0.05 tolerance, even though it clears every threshold.</p>
      </div>
    </div>
  );
}
const SERIES_COLORS = ["var(--pl-teal)", "var(--pl-good)", "var(--pl-accent)", "var(--pl-bad)"];

const CANDIDATES = [
  { id: "deploy-process-2024", note: "superseded Jenkins runbook: freeze Thursday 17:00" },
  { id: "deploy-process", note: "current: freeze Friday 15:00 UTC" },
  { id: "incident-severity", note: "mentions SEV1/SEV2, not the freeze" },
  { id: "oncall-policy", note: "rotation changes Monday 10:00" }
];

function Ranking() {
  const [order, setOrder] = useState(CANDIDATES.map(c => c.id));
  const [k, setK] = useState(2);
  const relevant = ["deploy-process"];
  const top = order.slice(0, k);
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
  };
  return (
    <div className="pl-lab" data-testid="rank-lab">
      <div className="pl-visual">
        <h3>Score a retrieval by hand</h3>
        <p className="pl-sub">Question: <em>&ldquo;When does the deployment change freeze start?&rdquo;</em> Only <code>deploy-process</code> is relevant. Reorder the results and change k to see each metric move.</p>
        <ol className="pl-rank">
          {order.map((id, i) => {
            const c = CANDIDATES.find(x => x.id === id)!;
            return (
              <li key={id} className={`${relevant.includes(id) ? "relevant" : ""} ${i >= k ? "outside" : ""}`}>
                <b>{i + 1}</b>
                <div>{id}<small>{c.note}{i >= k ? " · outside top-k" : ""}</small></div>
                <div className="moves">
                  <button type="button" aria-label={`Move ${id} up`} onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
                  <button type="button" aria-label={`Move ${id} down`} onClick={() => move(i, 1)} disabled={i === order.length - 1}>↓</button>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
      <div className="pl-controls">
        <label htmlFor="rk-k"><span>k (chunks passed to the model)<output htmlFor="rk-k">{k}</output></span>
          <input id="rk-k" type="range" min={1} max={4} value={k} onChange={e => setK(Number(e.target.value))} />
        </label>
        <div className="pl-tiles" data-testid="rank-tiles" aria-live="polite">
          <div><span>hit@k</span><strong>{hitAtK(order, relevant, k) ? "1" : "0"}</strong></div>
          <div><span>reciprocal rank</span><strong>{reciprocalRank(top, relevant).toFixed(2)}</strong></div>
          <div><span>context precision</span><strong>{contextPrecision(top, relevant).toFixed(2)}</strong></div>
        </div>
        <p className="pl-sub">
          {top[0] === "deploy-process-2024"
            ? "The stale runbook ranks first. An extractive or LLM answer will likely say Thursday 17:00. That is exactly how candidate-bad failed. A status filter removes it before ranking."
            : "Bigger k raises the chance of a hit but lowers precision, which spends tokens on noise and gives the model more to misread."}
        </p>
      </div>
    </div>
  );
}

export function RagLab() {
  return <><Sweep /><Configs /><Ranking /></>;
}
