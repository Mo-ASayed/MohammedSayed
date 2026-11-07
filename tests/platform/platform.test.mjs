import { test } from "node:test";
import assert from "node:assert/strict";
import { simulateGateway, defaultGatewayParams, CircuitBreaker, TokenBucket, realGatewayRun } from "../../src/lib/platform/gateway.ts";
import { MODELS, INSTANCES, planVram, minTensorParallel, pack, queuePoint, costPerMillionTokens, monthlyCost, kvBytesPerToken } from "../../src/lib/platform/gpu.ts";
import { hitAtK, reciprocalRank, contextPrecision, gate, CONFIG_RESULTS, sweepGate, SWEEP } from "../../src/lib/platform/rag.ts";

const model = id => MODELS.find(m => m.id === id);
const inst = id => INSTANCES.find(i => i.id === id);

test("gateway sim reproduces the committed Python run's failover shape", () => {
  const { summary, primaryCallsDuringOutage } = simulateGateway(defaultGatewayParams);
  assert.equal(primaryCallsDuringOutage, realGatewayRun.primaryCallsDuringOutage);
  assert.ok(summary.fallback > 50 && summary.fallback < 65);
  assert.equal(summary.failed, 0);
  assert.ok(summary.teams.batch.throttled > 10);
  assert.equal(summary.teams.search.throttled, 0);
});

test("content filter on the primary blocks instead of failing over", () => {
  const { summary } = simulateGateway({ ...defaultGatewayParams, primaryFault: "content_filter" });
  assert.equal(summary.fallback, 0);
  assert.ok(summary.blocked > 0);
});

test("without a fallback, outage requests fail once the circuit opens", () => {
  const { summary } = simulateGateway({ ...defaultGatewayParams, fallbackEnabled: false });
  assert.ok(summary.failed > 0 && summary.fallback === 0);
});

test("breaker and bucket primitives", () => {
  const b = new CircuitBreaker(2, 10);
  b.failure(0); assert.equal(b.state(0), "closed");
  b.failure(1); assert.equal(b.state(5), "open");
  assert.equal(b.allow(11), true); assert.equal(b.allow(11), false);
  const tb = new TokenBucket(60);
  for (let i = 0; i < 60; i++) assert.ok(tb.take(0));
  assert.equal(tb.take(0), false); assert.ok(tb.take(1));
});

test("vram maths matches gpuplan", () => {
  assert.equal(kvBytesPerToken(model("llama-3.1-8b")), 131072);
  assert.equal(planVram(model("llama-3.1-8b"), 24, "bf16", 8192, 3).maxConcurrency, 3);
  assert.equal(planVram(model("llama-3.1-8b"), 24, "bf16", 8192, 4).fits, false);
  assert.equal(minTensorParallel(model("llama-3.1-70b"), inst("p4d.24xlarge"), "bf16", 8192, 8), 8);
});

test("packing modes", () => {
  const w = [{ name: "small", memoryGb: 3, replicas: 4 }];
  assert.equal(pack(w, inst("g6.xlarge"), "exclusive").nodes.length, 4);
  assert.equal(pack(w, inst("g6.xlarge"), "time-slicing").nodes.length, 1);
  const mig = pack([{ name: "mid", memoryGb: 12, replicas: 2 }], inst("p4d.24xlarge"), "mig");
  assert.equal(mig.nodes[0][0].used, 40);
  assert.throws(() => pack(w, inst("g5.xlarge"), "mig"));
});

test("queue model matches the real mock benchmark within 5%", () => {
  for (const [c, ttft, lat, tps] of [[1, 0.0604, 1.0529, 30.32], [4, 0.0603, 1.0511, 120.86], [8, 1.1054, 2.0987, 121.22]]) {
    const q = queuePoint(c, 4, 32 / (1.05 - 0.05), 0.05, 32);
    assert.ok(Math.abs(q.latency - lat) / lat < 0.05, `latency c=${c}`);
    assert.ok(Math.abs(q.throughput - tps) / tps < 0.05, `throughput c=${c}`);
    if (c === 8) assert.ok(Math.abs(q.ttft - ttft) / ttft < 0.05);
  }
  assert.equal(Math.round(costPerMillionTokens(1, 1000) * 1000) / 1000, 0.278);
  assert.equal(monthlyCost(1, 8, true), 240);
});

test("retrieval metrics and gate agree with the committed results", () => {
  assert.equal(hitAtK(["b", "a"], ["a"], 1), false);
  assert.equal(reciprocalRank(["b", "a"], ["a"]), 0.5);
  assert.equal(contextPrecision(["a", "b", "a", "c"], ["a"]), 0.5);
  for (const c of CONFIG_RESULTS) assert.equal(gate(c.metrics).passed, c.passed, c.name);
  assert.equal(gate(CONFIG_RESULTS[0].metrics, undefined, CONFIG_RESULTS[3].metrics).passed, false); // baseline regresses vs v2
  const passing = SWEEP.map((_, i) => sweepGate(i)).filter(r => r.passed).map(r => r.floor);
  assert.deepEqual(passing, [0.1, 0.12, 0.14]);
});
