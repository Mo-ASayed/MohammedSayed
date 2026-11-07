# AI platform project pages

`/ai-platform` and three sub-pages present the `llm-gateway`, `gpu-inference-k8s` and `rag-eval-platform` repositories. Each page has a clickable request-path diagram, interactive labs and an 8-question "test me" quiz.

- Pages: `src/app/ai-platform/**` (server components and quiz content in `content.ts`). Styles are in `platform.css`: Apricot's warm palette, with dark values under `html[data-theme="dark"]`.
- Labs: `src/components/platform/*Lab.tsx`. They are client components with inline SVG charts and no chart library.
- Logic: `src/lib/platform/*.ts`. These are dependency-free browser ports of the Python code (router and circuit breaker, VRAM and bin-packing, retrieval metrics and the gate). They contain only erasable TypeScript so `node --test` can import them directly. Do not add parameter properties or enums.
- Numbers: every figure shown comes from a committed run in the project repos: `llm-gateway/results/simulation.json`, `gpu-inference-k8s/results/bench-mock.json`, and `rag-eval-platform/results/*.json`. Update `realGatewayRun`, `realMockBench`, `CONFIG_RESULTS` and `SWEEP` if those runs change. Mock numbers are labelled as mock, and prices are illustrative.
- Quiz best scores use the `ai-platform-quiz-<id>` localStorage keys. The quiz works when storage is blocked.

Checks: `npm run test:platform` (unit, 8 tests) and `npm run test:platform:browser`. The browser test needs the built site on port 4180: `npm run build && npx next start -p 4180`. It covers 4 widths, both themes, blocked storage and every lab interaction.
