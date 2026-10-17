# Apricot as a personal playground

## First-look review

The previous production homepage exposed fourteen actions in its first desktop
viewport: navigation, six lesson shortcuts and competing starting points. A new
visitor had to interpret course progress, review reminders and a RAG promotion
before choosing anything. The RAG explorer contained thirty-five controls across
navigation and the experiment. This was a working course dashboard, but it did
not serve Mohammed's goal of understanding ideas through small visual experiments.

## Revised journey

- The personal landing page has one primary action: a short model experiment.
- Four scenes explain examples, training, inference and the distinction between
  classifiers and language models. A nearest-centroid classifier fits two centres
  from six labelled examples. Sliders change an unseen input and its prediction.
- The ending introduces context and links directly to the RAG experiment.
- RAG starts with query, map and retrieved passages. Search settings and pipeline
  detail are opt-in, rather than competing with the first interaction.
- Notes stay accessible. Longer readings and games live under a disclosure.
  Review tools and sources are available through More. Existing saved progress
  and notes are preserved; earned points are shown within the longer exercises.
- The portfolio introduction and page metadata describe a personal side project.

The basic experiment makes no claim to simulate a neural network. It explains
the shared training/inference lifecycle and explicitly distinguishes a classifier
from an LLM. It also shows why limited inputs can yield wrong decisions. This is
a useful introductory mental model, not a complete explanation of all AI.

## Verification

Automated checks cover the one-primary-action landing page, the four scenes,
prediction changes, chart bounds, the handoff to RAG and mobile widths of 320,
390 and 768px. Existing game, review, notebook and reset tests now follow the
visible disclosure controls to reach optional features. They retain their original
functional assertions. A unit check verifies that changing training examples
changes learned centres and subsequent predictions.

Screenshots are inspected on desktop and mobile. This review checks usability
and correctness; it cannot establish real-user learning or repeat-visit rates.
