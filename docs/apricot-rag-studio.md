# Visual RAG studio

Entry: `/apricot#rag`, the featured homepage card, or the first RAG reading step.

The studio teaches an overview before offering interaction:

1. Compare an unsupported reply with an answer using a policy. Walk through six
   pipeline stops: collect, chunk, embed, retrieve, context and answer.
2. Search eight fictional travel passages. Compare exact keyword matching with
   six-dimensional cosine similarity, inspect passages, vary top-k and filter
   outdated policies. The animated question marker and connecting lines show
   which passages were retrieved. The map layout is illustrative, not a metric
   projection of the six-dimensional vectors.
3. Build an evidence tray for three travellers. Earn stamps for using a current
   policy, selecting the right subject and withholding an unsupported answer.

All search and scoring happen locally. `rag-studio.js` exports the pure retrieval
and evidence functions for testing. Query vectors count words from a fixed synonym
dictionary; document vectors are assigned by hand. This is deliberately not
advertised as a trained embedding model or a live LLM. Generated-looking replies
are scripted. The UI explains the limits and provides an optional numbers view.

Stamps use `apricot-rag-studio-v1`; the notebook's reset clears this key too.
Existing workshop progress and XP remain unchanged. Storage failure keeps the
activity playable and clearly reports that stamps cannot persist.

Reading pages now lead with two paragraphs and retain detailed reasoning in an
expandable section. The first LLM paragraph introduces its role in the application
before vocabulary about model internals.

Reference: [Microsoft Learn: RAG overview](https://learn.microsoft.com/en-us/azure/search/retrieval-augmented-generation-overview).
The implementation and teaching examples are original; no service integration is required.

Verification: unit tests cover synonyms, zero vectors, filtering, top-k and
evidence checking. The browser suite covers the full studio, text escaping,
persisted stamps, reset and 320/390/768px layouts. Existing workshop suites verify
that reading gates, labs, review sessions and notebooks still work.
