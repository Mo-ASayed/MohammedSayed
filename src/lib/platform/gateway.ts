// Browser port of llm-gateway's router + circuit breaker + team token bucket.
// Same rules as gateway/router.py and gateway/limits.py; kept dependency-free so
// `node --test` can import it directly.

export type Breaker = "closed" | "open" | "half_open";
export type Outcome = "primary" | "fallback" | "throttled" | "blocked" | "failed";
export type Team = "search" | "support" | "batch";

export interface GatewayParams {
  requests: number;
  stepSeconds: number;
  outageStart: number;
  outageEnd: number;
  threshold: number;
  cooldownSeconds: number;
  batchRpm: number;
  primaryFault: "error" | "content_filter";
  fallbackEnabled: boolean;
}

export interface GatewayRow {
  i: number;
  t: number;
  team: Team;
  outcome: Outcome;
  attempts: string[];
  breaker: Breaker;
}

export const defaultGatewayParams: GatewayParams = {
  requests: 240,
  stepSeconds: 0.5,
  outageStart: 60,
  outageEnd: 120,
  threshold: 3,
  cooldownSeconds: 30,
  batchRpm: 10,
  primaryFault: "error",
  fallbackEnabled: true
};

// 5 : 3 : 2 traffic mix, deterministic so the chart is stable.
const MIX: Team[] = ["search", "support", "search", "batch", "search", "support", "search", "support", "batch", "search"];
const RPM: Record<Team, number> = { search: 120, support: 60, batch: 10 };

// Illustrative list prices (USD / 1K tokens), as in llm-gateway/config/gateway.yaml.
export const PRICES = {
  primary: { name: "Bedrock Claude 3.5 Haiku", input: 0.0008, output: 0.004 },
  fallback: { name: "Azure OpenAI gpt-4o-mini", input: 0.00015, output: 0.0006 }
} as const;
const TOKENS_IN = 30;
const TOKENS_OUT = 20;

export class CircuitBreaker {
  failures = 0;
  openedAt: number | null = null;
  trial = false;
  threshold: number;
  cooldown: number;
  constructor(threshold: number, cooldown: number) { this.threshold = threshold; this.cooldown = cooldown; }
  state(now: number): Breaker {
    if (this.openedAt === null) return "closed";
    return now - this.openedAt >= this.cooldown ? "half_open" : "open";
  }
  allow(now: number): boolean {
    const s = this.state(now);
    if (s === "closed") return true;
    if (s === "half_open" && !this.trial) { this.trial = true; return true; }
    return false;
  }
  success(): void { this.failures = 0; this.openedAt = null; this.trial = false; }
  failure(now: number): void {
    this.trial = false;
    this.failures += 1;
    if (this.failures >= this.threshold || this.openedAt !== null) this.openedAt = now;
  }
}

export class TokenBucket {
  tokens: number;
  updated = 0;
  perMinute: number;
  constructor(perMinute: number) { this.perMinute = perMinute; this.tokens = perMinute; }
  take(now: number): boolean {
    this.tokens = Math.min(this.perMinute, this.tokens + (now - this.updated) * (this.perMinute / 60));
    this.updated = now;
    if (this.tokens >= 1) { this.tokens -= 1; return true; }
    return false;
  }
}

export function simulateGateway(p: GatewayParams) {
  const breaker = new CircuitBreaker(p.threshold, p.cooldownSeconds);
  const buckets: Record<Team, TokenBucket> = {
    search: new TokenBucket(RPM.search), support: new TokenBucket(RPM.support), batch: new TokenBucket(p.batchRpm)
  };
  const rows: GatewayRow[] = [];
  let primaryCalls = 0;
  let primaryCallsDuringOutage = 0;
  for (let i = 0; i < p.requests; i++) {
    const t = i * p.stepSeconds;
    const team = MIX[i % MIX.length];
    const down = i >= p.outageStart && i < p.outageEnd;
    const attempts: string[] = [];
    let outcome: Outcome;
    if (!buckets[team].take(t)) {
      outcome = "throttled";
    } else if (!breaker.allow(t)) {
      attempts.push("primary: skipped (circuit open)");
      outcome = p.fallbackEnabled ? "fallback" : "failed";
      if (p.fallbackEnabled) attempts.push("fallback: ok");
    } else {
      primaryCalls++;
      if (down) primaryCallsDuringOutage++;
      if (down && p.primaryFault === "content_filter") {
        breaker.success(); // provider is healthy; it refused the prompt
        attempts.push("primary: 400 content_filter");
        outcome = "blocked";
      } else if (down) {
        breaker.failure(t);
        attempts.push("primary: 500");
        outcome = p.fallbackEnabled ? "fallback" : "failed";
        if (p.fallbackEnabled) attempts.push("fallback: ok");
      } else {
        breaker.success();
        attempts.push("primary: ok");
        outcome = "primary";
      }
    }
    rows.push({ i, t, team, outcome, attempts, breaker: breaker.state(t) });
  }
  return { rows, summary: summarise(rows), primaryCalls, primaryCallsDuringOutage };
}

export function requestCost(target: "primary" | "fallback", tokensIn = TOKENS_IN, tokensOut = TOKENS_OUT): number {
  const price = PRICES[target];
  return (tokensIn / 1000) * price.input + (tokensOut / 1000) * price.output;
}

export function summarise(rows: GatewayRow[]) {
  const count = (o: Outcome) => rows.filter(r => r.outcome === o).length;
  const teams: Record<Team, { sent: number; ok: number; throttled: number; cost: number }> = {
    search: { sent: 0, ok: 0, throttled: 0, cost: 0 },
    support: { sent: 0, ok: 0, throttled: 0, cost: 0 },
    batch: { sent: 0, ok: 0, throttled: 0, cost: 0 }
  };
  for (const r of rows) {
    const s = teams[r.team];
    s.sent++;
    if (r.outcome === "throttled") s.throttled++;
    if (r.outcome === "primary" || r.outcome === "fallback") {
      s.ok++;
      s.cost += requestCost(r.outcome);
    }
  }
  return {
    primary: count("primary"), fallback: count("fallback"), throttled: count("throttled"),
    blocked: count("blocked"), failed: count("failed"), teams
  };
}

// Committed output of llm-gateway/scripts/simulate.py (seed 7, mock providers).
export const realGatewayRun = {
  servedByPrimary: 161,
  servedByFallback: 59,
  primaryCallsDuringOutage: 3,
  teams: {
    search: { sent: 122, ok: 122, throttled: 0 },
    support: { sent: 70, ok: 70, throttled: 0 },
    batch: { sent: 48, ok: 28, throttled: 20 }
  }
} as const;
