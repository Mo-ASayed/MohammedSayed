# Apricot visual direction

Reference reviewed in a browser: https://hamidhirsi.com, 17 October 2026.
The useful design cues were contrasting dark and cream sections, large editorial
serif headings, a restrained orange accent, numbered labels and a split hero.
Apricot uses original copy and diagrams; no source assets or branding were copied.

Changes:

- A dark split hero puts an interactive classifier preview beside a short personal
  introduction. The slider changes both input counts and runs the existing
  nearest-centroid classifier. Its compact diagram is schematic.
- A document-stack illustration explains question, retrieved passage and supported
  answer before the visitor opens RAG.
- The main experiment has a compact four-stage progress strip, learned-centre
  values, a connecting line to the chosen centre and distance meters. Distances
  are Euclidean distances in the toy feature space, not confidence percentages.
- The LLM scene presents context, a learned model and an incrementally revealed
  response. This is explicitly scripted. The displayed text pieces are an
  illustration of incremental output, not a model-specific tokenisation.
- Nested boxes replace a paragraph about the relationship between AI, machine
  learning and language models. Key caveats stay visible in short captions.

Browser checks exercise the preview in both directions, all experiment stages,
distance ordering, response reveal/replay, RAG navigation and narrow layouts.
The design retains keyboard controls and reduced-motion support.
