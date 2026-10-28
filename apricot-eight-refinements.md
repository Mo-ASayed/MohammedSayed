# Eight refinements, 28 October 2026

Eight separate improvement commits following `208193c`.

1. A live loss trace records successive training steps. Manual parameter changes and changed labels start a fresh trace.
2. An inference probe moves a new input along the fitted line without changing model parameters or training error.
3. A comparison table shows all three models on the same dataset, with validation errors hidden until revealed.
4. Validation error gaps and the largest miss connect aggregate error to individual predictions.
5. Observed word-frequency bars sit alongside theoretical probabilities. Changing the sampling distribution clears previous counts.
6. A greedy-choice comparison shows how selecting the highest probability differs from sampling, without adding fake samples.
7. Forty keyboard-accessible request tiles show individual predictions and outcomes. Outcome labels remain hidden until revealed.
8. A weighted-error comparison shows deployed and candidate costs under the same false-alarm and missed-alert penalties.

Additional detail stays in optional panels where possible. All data and cost units remain illustrative.

Validation: production build and TypeScript, 43 unit tests, existing and expanded visual experiment browser suites, map/personal flow checks, portfolio integration and styling checks. Browser checks cover 320, 390 and 768 pixel widths, keyboard inspection, resets, disclosure of outcomes, unchanged parameters during inference, and sample-count integrity. Desktop screenshots were reviewed. The new regression suite is included in GitHub Actions.
