# Twelve visual improvements beyond RAG

27 October 2026

Four experiments at `/apricot#experiments`, each with a short introduction before the controls. The home-page tiles open the corresponding introduction. No account, API key or live model is needed.

## Fit a line

1. Adjust a line's rise and starting height; see residual gaps and mean squared error update.
2. Train one step or watch twelve gradient steps. Reduced-motion users receive the result immediately.
3. Change one label while holding the model fixed, then retrain to see how an outlier changes the fit.

## Overfitting

4. Compare a constant baseline, least-squares line and interpolating polynomial on the same data.
5. Reveal held-out validation points and compare training and validation mean absolute error.
6. Change training noise while keeping validation data fixed, then solve a generalisation challenge.

## Next-word sampling

7. Adjust temperature and see the candidate probabilities and probability strip change.
8. Apply top-k filtering; excluded candidates receive zero probability and remaining probabilities sum to one.
9. Draw one or 200 samples. See the selected word, random-ticket marker and observed counts alongside theoretical probabilities.

## Production drift

10. Compare input shift with a changed target rule using reference/current histograms.
11. Reveal outcome labels to expose false alarms, misses and accuracy that input monitoring cannot measure.
12. Adjust a candidate threshold and compare it with the fixed deployed rule. The exercise explicitly requires fresh validation before deployment.

## Model limits

All datasets are invented and all calculations run locally. The fitting model uses a normalised input internally; its UI reports the rise across five load units. The overfitting curve is a degree-five interpolating polynomial, not a neural network. The sampling experiment uses five hand-set candidate scores for one fixed prompt and a reproducible pseudo-random sequence. Drift outcomes are immediately available only for this illustration. No result is presented as a production benchmark.

## Map corrections included

Seven authored questions and alternate phrasings start at relevant map positions. Manual movement is identified as a deliberate representation change. Answer diagnostics distinguish missing policies, retrieval cutoffs, context overflow, conflicting versions and supported answers. The example from the reported cabin-bag failure is covered by unit and browser tests.

## Verification

40 unit tests cover the existing playground and new numerical models. Browser coverage includes learning before controls, all four challenges, changing labels, held-out validation, probability sampling, drift, resets, keyboard interaction, animated and reduced-motion training, blocked browser storage, routes and 320/390/768 pixel layouts. Existing portfolio and Apricot flows are also checked. New browser coverage runs in GitHub Actions.
