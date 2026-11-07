// Retrieval metrics and the release gate from rag-eval-platform, plus its committed results.

export function hitAtK(retrieved: string[], relevant: string[], k: number): boolean {
  return retrieved.slice(0, k).some(d => relevant.includes(d));
}

export function reciprocalRank(retrieved: string[], relevant: string[]): number {
  const i = retrieved.findIndex(d => relevant.includes(d));
  return i < 0 ? 0 : 1 / (i + 1);
}

export function contextPrecision(retrieved: string[], relevant: string[]): number {
  return retrieved.length ? retrieved.filter(d => relevant.includes(d)).length / retrieved.length : 0;
}

export type Metrics = Record<string, number>;
export const LOWER_IS_BETTER = new Set(["false_abstention_rate"]);

export const THRESHOLDS: Metrics = {
  hit_rate: 0.9, mrr: 0.85, answer_accuracy: 0.8, faithfulness: 0.9, abstention_accuracy: 1.0, false_abstention_rate: 0.12
};

export function gate(metrics: Metrics, thresholds: Metrics = THRESHOLDS, champion?: Metrics, maxRegression = 0.05) {
  const reasons: string[] = [];
  for (const [name, limit] of Object.entries(thresholds)) {
    const v = metrics[name];
    if (v === undefined) reasons.push(`${name}: missing`);
    else if (LOWER_IS_BETTER.has(name) ? v > limit : v < limit)
      reasons.push(`${name} ${v.toFixed(2)} ${LOWER_IS_BETTER.has(name) ? ">" : "<"} ${limit}`);
  }
  if (champion) {
    for (const name of Object.keys(thresholds)) {
      if (!(name in champion) || !(name in metrics)) continue;
      const delta = metrics[name] - champion[name];
      if (LOWER_IS_BETTER.has(name) ? delta > maxRegression + 1e-9 : -delta > maxRegression + 1e-9)
        reasons.push(`${name} regressed ${champion[name].toFixed(2)} → ${metrics[name].toFixed(2)}`);
    }
  }
  return { passed: reasons.length === 0, reasons };
}

// Committed results/eval-*.json from rag-eval-platform (run in this order).
export const CONFIG_RESULTS: { name: string; summary: string; metrics: Metrics; passed: boolean; version: number | null }[] = [
  { name: "baseline", summary: "90-word chunks, k=4, floor 0.12", passed: true, version: 1,
    metrics: { hit_rate: 1.0, mrr: 0.9733, context_precision: 0.32, answer_accuracy: 0.88, faithfulness: 1.0, abstention_accuracy: 1.0, false_abstention_rate: 0.08 } },
  { name: "candidate-bad", summary: "whole docs, k=1, no floor, superseded docs on", passed: false, version: null,
    metrics: { hit_rate: 0.84, mrr: 0.84, context_precision: 0.84, answer_accuracy: 0.76, faithfulness: 1.0, abstention_accuracy: 0.75, false_abstention_rate: 0.04 } },
  { name: "candidate-loose", summary: "60-word chunks, floor 0.08", passed: false, version: null,
    metrics: { hit_rate: 1.0, mrr: 0.9333, context_precision: 0.37, answer_accuracy: 0.96, faithfulness: 1.0, abstention_accuracy: 0.5, false_abstention_rate: 0.0 } },
  { name: "candidate-tuned", summary: "60-word chunks, floor 0.10", passed: true, version: 2,
    metrics: { hit_rate: 1.0, mrr: 0.9333, context_precision: 0.37, answer_accuracy: 0.96, faithfulness: 1.0, abstention_accuracy: 1.0, false_abstention_rate: 0.0 } }
];

// results/sweep-min_score.json: [floor, answer_accuracy, abstention_accuracy, false_abstention_rate]
export const SWEEP: [number, number, number, number][] = [
  [0.0, 0.96, 0.25, 0.0], [0.02, 0.96, 0.25, 0.0], [0.04, 0.96, 0.25, 0.0], [0.06, 0.96, 0.5, 0.0],
  [0.08, 0.96, 0.5, 0.0], [0.1, 0.96, 1.0, 0.0], [0.12, 0.92, 1.0, 0.04], [0.14, 0.92, 1.0, 0.04],
  [0.16, 0.8, 1.0, 0.2], [0.18, 0.72, 1.0, 0.28], [0.2, 0.68, 1.0, 0.32]
];

export function sweepGate(floorIndex: number) {
  const [floor, acc, abst, falseAbst] = SWEEP[floorIndex];
  const m = { ...CONFIG_RESULTS[3].metrics, answer_accuracy: acc, abstention_accuracy: abst, false_abstention_rate: falseAbst };
  return { floor, ...gate(m) };
}
