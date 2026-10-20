# Apricot: fourteen improvements, 20 October 2026

The requested random draw used PowerShell Get-Random with inclusive bounds 7 and 15 and returned 14. Each item below has its own implementation commit, based on 6db2307.

1. Fix contradictory source text when the meeting is moved to Thursday.
2. Scrub the scripted response timeline; distinguish display pieces from model tokens.
3. Retrain a miniature classifier with wrong labels and observe changed centres and predictions.
4. Plot each email score against the live threshold.
5. Explain precision and recall with actual counts, including the undefined-precision case.
6. Minimise mistake costs; distinguish tuning on validation data from final testing.
7. Focus on errors and inspect the features that caused each prediction.
8. Cut passages directly at accessible phrase boundaries.
9. Add overlapping context and see the storage cost of repeated phrases.
10. Limit top-k independently from search distance and context capacity, with undo and comparison support.
11. Inspect supplied sources from the answer and preserve the refundable-booking condition.
12. Explore a fourth map layer on missing evidence and withholding unsupported claims.
13. Save experiment observations into the existing notebook and Markdown export.
14. Simplify map actions, add a live retrieval summary, fix immediate progress marks, and keep score charts readable on small screens.

The added explanations and experiments remain optional disclosures beside their parent concepts. All data, phrase budgets, policies and generated responses are explicitly illustrative. No login, model API or backend was added.

Validation: production build; 30 unit checks; all existing browser suites; new coverage of label corruption, metrics edge cases, cost trade-offs, score plotting, response scrubbing, top-k undo, citations, direct cuts, overlap, notebook persistence/export, and fourth-layer completion. Responsive checks cover 320, 390 and 768 pixels. New regression checks also run in GitHub CI. Screenshot evidence is saved under test-results/refinement-*.png.
