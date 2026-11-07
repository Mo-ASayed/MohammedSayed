import type { Metadata } from "next";
import { Flow } from "../../../components/platform/Flow";
import { GatewayLab } from "../../../components/platform/GatewayLab";
import { ProjectHeader } from "../../../components/platform/ProjectHeader";
import { Quiz } from "../../../components/platform/Quiz";
import { gatewayQuiz, platformProjects } from "../content";

const project = platformProjects[0];

export const metadata: Metadata = {
  title: "Multi-cloud LLM gateway",
  description: "An LLM gateway in front of Amazon Bedrock and Azure OpenAI: per-team limits, token quotas, cost attribution and circuit-breaker failover, with an interactive failover simulation and a self-test.",
  alternates: { canonical: "https://mohammedsayed.com/ai-platform/llm-gateway" }
};

const steps = [
  { name: "Authenticate", tag: "auth.py", detail: "Bearer key → SHA-256 → team. Keys are never stored in plain text, and every team is compared in constant time. Each team has an allow-list of routes, so only some teams may use the expensive reasoning model." },
  { name: "Preflight", tag: "guardrails.py", detail: "Cheap local checks before any paid call: prompt size cap, a deny-list for known injection phrases, and masking of e-mails and Luhn-valid card numbers. This complements Bedrock Guardrails and Azure content filters but cannot replace them." },
  { name: "Admit", tag: "limits.py", detail: "Three limits per team: a requests-per-minute token bucket, a tokens-per-minute sliding window, and a daily USD budget. The estimated tokens are reserved now and settled with real usage afterwards." },
  { name: "Route", tag: "router.py", detail: "Ordered targets per route, e.g. Bedrock Claude, then Azure gpt-4o-mini. Retryable errors (429, 5xx, timeouts) move to the next target. Each target's circuit breaker skips it after 3 consecutive failures and sends one trial request after the cooldown. Content-filter refusals never fail over." },
  { name: "Call the provider", tag: "providers/", detail: "Bedrock through the Converse API with guardrailConfig; 'guardrail_intervened' becomes a 400. Azure OpenAI through the deployment URL; 429 with retry-after is the deployment's TPM quota, and a 'content_filter' error or finish reason becomes a 400." },
  { name: "Attribute and observe", tag: "pricing.py + metrics.py", detail: "Cost = input tokens × input price + output tokens × output price for the target that actually served the request. Prometheus counters and histograms are labelled by team, route and target. Grafana and alert rules ship in deploy/." }
];

export default function LlmGatewayPage() {
  return (
    <main className="subpage platform" id="main">
      <ProjectHeader eyebrow="AI platform project 01" repo={project.repo} tags={project.tags}
        title={<>One door for <em>every model.</em></>}
        lede="Teams should not each hold their own Bedrock and Azure OpenAI credentials, limits and cost reports. This gateway gives them one endpoint and puts those controls in one place." />
      <div className="pl-wrap">
        <section className="pl-section">
          <h2>The request path</h2>
          <p>Six stages, each in its own module. Select one to see what it does and why.</p>
          <Flow steps={steps} label="Gateway request path" />
        </section>
        <section className="pl-section">
          <h2>Break the primary and watch it fail over</h2>
          <p>A browser port of the gateway&apos;s router, breaker and team limits. Move the outage, change the breaker, or make the primary refuse prompts instead of failing.</p>
          <GatewayLab />
        </section>
        <section className="pl-section" id="test-me">
          <h2>Test me</h2>
          <p>Questions an interviewer could ask about this design, including numbers from the committed run.</p>
          <Quiz id="llm-gateway" title="LLM gateway" questions={gatewayQuiz} />
        </section>
        <section className="pl-section">
          <h2>Run it yourself</h2>
          <p>Free and local: <code>pip install -e &quot;.[dev]&quot; &amp;&amp; pytest -q</code> (36 tests), <code>python scripts/simulate.py</code>, and <code>docker compose -f deploy/docker-compose.yml up</code> for Prometheus and Grafana. The Terraform for a Bedrock Guardrail, least-privilege IAM, a Bedrock budget, an Azure OpenAI deployment with a custom content filter, and an optional APIM policy is cost-flagged. It is validated but has not been applied.</p>
        </section>
      </div>
    </main>
  );
}
