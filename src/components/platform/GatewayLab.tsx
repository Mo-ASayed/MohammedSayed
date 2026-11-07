"use client";

import { useMemo, useState } from "react";
import { defaultGatewayParams, PRICES, realGatewayRun, simulateGateway, type GatewayParams, type Outcome } from "../../lib/platform/gateway";

const COLORS: Record<Outcome, string> = {
  primary: "var(--pl-teal)", fallback: "var(--pl-accent)", throttled: "var(--pl-warn)", blocked: "var(--pl-bad)", failed: "var(--pl-ink)"
};
const LABELS: Record<Outcome, string> = {
  primary: "Bedrock (primary)", fallback: "Azure OpenAI (failover)", throttled: "429 team limit", blocked: "400 content filter", failed: "503 no target"
};
const BREAKER: Record<string, string> = { closed: "var(--pl-good)", open: "var(--pl-bad)", half_open: "var(--pl-warn)" };

function Range({ id, label, value, min, max, step = 1, suffix = "", onChange }:
  { id: string; label: string; value: number; min: number; max: number; step?: number; suffix?: string; onChange: (v: number) => void }) {
  return (
    <label htmlFor={id}>
      <span>{label}<output htmlFor={id}>{value}{suffix}</output></span>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} />
    </label>
  );
}

export function GatewayLab() {
  const [p, setP] = useState<GatewayParams>(defaultGatewayParams);
  const [inspect, setInspect] = useState(62);
  const sim = useMemo(() => simulateGateway(p), [p]);
  const set = (patch: Partial<GatewayParams>) => setP(prev => {
    const next = { ...prev, ...patch };
    if (next.outageEnd < next.outageStart) next.outageEnd = next.outageStart;
    return next;
  });
  const W = 720, barW = W / p.requests;
  const row = sim.rows[Math.min(inspect, sim.rows.length - 1)];
  const teams = sim.summary.teams;
  const maxSent = Math.max(...Object.values(teams).map(t => t.sent));

  return (
    <>
      <div className="pl-lab" data-testid="gateway-lab">
        <div className="pl-visual">
          <h3>240 requests through the router</h3>
          <p className="pl-sub">Each bar is one request, 0.5 s apart. The shaded window is the primary's outage. The band underneath is the primary's circuit breaker. Click a bar, or use the slider, to inspect a request.</p>
          <svg className="pl-chart" viewBox={`0 0 ${W} 150`} role="img"
               aria-label={`Request outcomes: ${sim.summary.primary} served by Bedrock, ${sim.summary.fallback} by failover, ${sim.summary.throttled} throttled, ${sim.summary.blocked} blocked, ${sim.summary.failed} failed`}>
            <rect x={p.outageStart * barW} y={0} width={(p.outageEnd - p.outageStart) * barW} height={104} fill="var(--pl-bad)" opacity={0.1} />
            {p.outageEnd > p.outageStart && <text x={p.outageStart * barW + 4} y={12}>primary outage</text>}
            {sim.rows.map(r => (
              <rect key={r.i} x={r.i * barW} y={18} width={Math.max(barW - 0.6, 0.8)} height={78} fill={COLORS[r.outcome]}
                    opacity={r.i === inspect ? 1 : 0.85} onClick={() => setInspect(r.i)} style={{ cursor: "pointer" }} />
            ))}
            <rect x={inspect * barW - 1} y={14} width={barW + 2} height={86} fill="none" stroke="var(--pl-ink)" strokeWidth={1.5} />
            {sim.rows.map(r => <rect key={`b${r.i}`} x={r.i * barW} y={110} width={barW + 0.3} height={10} fill={BREAKER[r.breaker]} />)}
            <text x={0} y={138}>circuit: green closed · red open · amber half-open</text>
            <text x={W} y={138} textAnchor="end">t = {(p.requests * p.stepSeconds).toFixed(0)} s</text>
          </svg>
          <div className="pl-legend">
            {(Object.keys(LABELS) as Outcome[]).map(k => <span key={k}><i style={{ background: COLORS[k] }} />{LABELS[k]}</span>)}
          </div>
          <div className="pl-tiles" aria-live="polite" data-testid="gateway-tiles">
            <div><span>Served by Bedrock</span><strong>{sim.summary.primary}</strong></div>
            <div><span>Failed over to Azure</span><strong>{sim.summary.fallback}</strong></div>
            <div><span>Primary calls while it was down</span><strong>{sim.primaryCallsDuringOutage}</strong></div>
            <div><span>Throttled (429)</span><strong>{sim.summary.throttled}</strong></div>
            <div><span>Blocked (400)</span><strong>{sim.summary.blocked}</strong></div>
            <div><span>Failed (503)</span><strong>{sim.summary.failed}</strong></div>
          </div>
          <label htmlFor="gw-inspect" className="pl-controls" style={{ marginTop: 14 }}>
            <span>Inspect request <output htmlFor="gw-inspect">#{inspect}</output></span>
            <input id="gw-inspect" type="range" min={0} max={p.requests - 1} value={inspect} onChange={e => setInspect(Number(e.target.value))} />
          </label>
          <div className="pl-inspect" data-testid="gateway-inspect">
            <strong>#{row.i}</strong> at t={row.t.toFixed(1)} s · team <b>{row.team}</b> · {LABELS[row.outcome]}<br />
            {row.attempts.length ? row.attempts.join(" → ") : "Refused by the team's token bucket before any provider call."}<br />
            Breaker after this request: <b>{row.breaker.replace("_", "-")}</b>
          </div>
        </div>
        <div className="pl-controls">
          <Range id="gw-start" label="Outage starts at request" value={p.outageStart} min={0} max={239} onChange={v => set({ outageStart: v })} />
          <Range id="gw-end" label="Outage ends at request" value={p.outageEnd} min={0} max={240} onChange={v => set({ outageEnd: v })} />
          <Range id="gw-threshold" label="Failures before circuit opens" value={p.threshold} min={1} max={10} onChange={v => set({ threshold: v })} />
          <Range id="gw-cooldown" label="Cooldown before half-open trial" value={p.cooldownSeconds} min={5} max={90} suffix=" s" onChange={v => set({ cooldownSeconds: v })} />
          <Range id="gw-rpm" label="Batch team limit" value={p.batchRpm} min={5} max={60} suffix=" rpm" onChange={v => set({ batchRpm: v })} />
          <div>
            <span style={{ fontSize: ".82rem" }}>What goes wrong on the primary?</span>
            <div className="pl-segment" role="group" aria-label="Primary fault" style={{ marginTop: 6 }}>
              <button type="button" aria-pressed={p.primaryFault === "error"} onClick={() => set({ primaryFault: "error" })}>HTTP 500 outage</button>
              <button type="button" aria-pressed={p.primaryFault === "content_filter"} onClick={() => set({ primaryFault: "content_filter" })} data-testid="gw-filter">Guardrail blocks prompts</button>
            </div>
          </div>
          <label className="pl-check" htmlFor="gw-fallback">
            <input id="gw-fallback" type="checkbox" checked={p.fallbackEnabled} onChange={e => set({ fallbackEnabled: e.target.checked })} />
            Azure OpenAI configured as fallback
          </label>
          <button className="pl-button ghost" type="button" onClick={() => setP(defaultGatewayParams)}>Reset to the committed run</button>
        </div>
      </div>

      <div className="pl-lab">
        <div className="pl-visual">
          <h3>Per-team attribution</h3>
          <p className="pl-sub">Every successful request is priced as tokens × that target&apos;s price table (illustrative prices, ~30 input and 20 output tokens per request). Failover changes the bill as well as the latency.</p>
          <svg className="pl-chart" viewBox="0 0 520 170" role="img" aria-label="Requests per team split into served and throttled">
            {(Object.entries(teams) as [string, typeof teams.search][]).map(([name, t], i) => {
              const y = 14 + i * 50, scale = 380 / Math.max(maxSent, 1);
              return (
                <g key={name}>
                  <text x={0} y={y + 18}>{name}</text>
                  <rect x={70} y={y} width={t.ok * scale} height={26} fill="var(--pl-teal)" />
                  <rect x={70 + t.ok * scale} y={y} width={t.throttled * scale} height={26} fill="var(--pl-warn)" />
                  <text x={74 + t.sent * scale} y={y + 18}>{t.ok} ok · {t.throttled} × 429 · ${t.cost.toFixed(4)}</text>
                </g>
              );
            })}
          </svg>
          <div className="pl-legend"><span><i style={{ background: "var(--pl-teal)" }} />served</span><span><i style={{ background: "var(--pl-warn)" }} />throttled</span></div>
        </div>
        <div className="pl-controls">
          <div className="pl-table-wrap">
            <table className="pl-table">
              <thead><tr><th>Target</th><th>$ / 1K in</th><th>$ / 1K out</th></tr></thead>
              <tbody>
                {Object.values(PRICES).map(pr => <tr key={pr.name}><td>{pr.name}</td><td className="num">{pr.input}</td><td className="num">{pr.output}</td></tr>)}
              </tbody>
            </table>
          </div>
          <p className="pl-sub">Illustrative list prices from the repo config. Check the AWS and Azure pricing pages before using them for real chargeback.</p>
        </div>
      </div>

      <div className="pl-note" data-testid="gateway-real">
        <strong>The real run.</strong> <code>scripts/simulate.py</code> drives the actual Python gateway (auth, limiter, router, breaker, metrics) with mock providers. Its committed output: {realGatewayRun.servedByPrimary} requests served by Bedrock and {realGatewayRun.servedByFallback} by Azure. Only {realGatewayRun.primaryCallsDuringOutage} calls reached Bedrock while it was failing. The batch team had {realGatewayRun.teams.batch.throttled} of {realGatewayRun.teams.batch.sent} requests throttled. The lab above is a browser port of the same rules. Its team mix is a fixed pattern rather than seeded random, so counts differ slightly.
      </div>
    </>
  );
}
