# Apricot improvements, 23 October 2026

Fourteen separate commits, following `d5cb329`:

1. Browser history and shareable routes for lessons and notebook.
2. Revisit learned AI scenes from the progress strip.
3. Drag the prediction ring, or move it with arrow keys.
4. Reveal the classifier's decision boundary.
5. Compare differently labelled messages with identical model inputs.
6. Compare clean training centres with noisy-label centres.
7. Freeze a trained model while changing its training data, then retrain.
8. Explain why each passage was included or excluded from retrieval.
9. Restore document positions while retaining settings, with undo.
10. Compare query positions and actual answers between pinned setups.
11. Revisit RAG stages and navigate the pipeline in either direction.
12. Change chunk capacity independently of the cut point.
13. Compare evaluation outcomes against the original threshold.
14. Reset chunking and inbox experiments; correct full-ring pointer interaction, frozen-model copy, checkbox alignment and lesson refresh resumption.

The extra experiments remain optional disclosures. The examples use toy models, invented data and scripted answers, with those limits stated in the interface.

## Validation

- Production build and TypeScript checks passed.
- 33 unit tests passed.
- All existing browser suites passed: lesson gates, mastery, review, RAG studio, personal flow, map expedition, learning depth, refinements, site integration and portfolio styling.
- New usability browser suite covers history, scene revisits, held-model predictions, mouse/keyboard inference, feature twins, evaluation comparison/reset, pipeline navigation, stage revisits, retrieval audit, position restore/undo, answer comparison, chunk capacity/reset and responsive layouts.
- Checked 320, 390 and 768 pixel widths for overflow. Reviewed desktop screenshots.
- New browser suite is included in GitHub Actions.
