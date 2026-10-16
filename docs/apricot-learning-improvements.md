# Apricot: returning to learn

## Problem

The first version tracked completed labs and badges but did little to support returning learners. Reading acknowledgement was easy to confuse with understanding, and there was no scheduled recall or record of concepts needing another attempt. Reopening a completed reading sequence also returned to its last page rather than the stage the learner actually left.

## Product references

- [Brilliant: how it teaches](https://brilliant.org/resources/choosing-brilliant/how-brilliant-teaches-math/): interactive problem-solving and feedback close to an attempt. Applied as worked calculation feedback and inspectable process diagrams.
- [Exercism](https://exercism.org/): learning, practice and feedback are distinct activities. Applied as a separate review area, while retaining learning-first lab gates.
- [The Learning Scientists](https://www.learningscientists.org/faq): retrieval practice and spaced practice are supported learning strategies. Applied as short recall sessions with explicit review intervals.

These references inform the design, not a claim that Apricot has measured learning outcomes equivalent to those products. No content was copied.

## Changes

- 24 review prompts: 18 written explanations and six calculations, unlocked by reading the relevant topic.
- Sessions of up to five prompts. The answer is hidden until the learner attempts it or says they cannot recall it.
- Calculations are checked numerically. Prose is explicitly self-assessed; there is no model pretending to grade it.
- Again: 10 minutes; Almost: one day; Got it: three days, doubling on later successful reviews up to 30 days. This is a simple schedule, not FSRS or a validated readiness model.
- A review journal retains prompts marked Again or Almost, plus the latest written answer. It is private to the browser and rendered with HTML escaping.
- A suggested next session, exact-stage resume and separate reading/lab/review counts.
- Clickable diagrams explain what happens at each stage.

Review records and resume position use `apricot-study-v1`; existing notes and badges remain in `apricot-workshop-v1`. Reset removes both sets of local progress. There is no account, cloud sync, external call, notification or tracking service. A shared browser profile means shared local progress. Notebook Markdown export covers notebook notes, not review answers.

## Verification

15 unit tests cover computations, scheduling, eligibility, saved-state validation and text escaping. Browser checks exercise recall and numerical feedback, disabled ratings after incorrect answers, exact-step resume, scheduling persistence, reset, mobile layouts and diagram interaction. Existing lab and mastery walkthroughs also pass. Production integration checks cover route refreshes and portfolio navigation.
