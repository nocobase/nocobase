---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "Testes de acerto"
description: "Enter test text on the Hit tests page and inspect matched document segments under Top K and Score settings."
keywords: "knowledge base hit tests,Hit tests,Top K,Score,RAG,NocoBase"
---
# Testes de acerto

## Open the Hit tests page

After opening the knowledge base detail page, click Hit tests in the left sidebar. This page tests which document segments can be matched by a user input. It does not directly call AI employees and does not generate final answers.

![](https://static-docs.nocobase.com/ai-employees/knowledge-base/knowledge-base/2026-06-12/hit-tests-results.png)

## Run a test

Enter test text in the bottom input box, then click Send. NocoBase retrieves from the current knowledge base and shows matched segments by similarity from high to low.

Each result card shows match order, document title, similarity score, segment preview, and source filename. Click a result card to view fuller segment content, score, and matched related questions. If there are no matches, the page shows No matching documents found.

## Adjust test parameters

Click Settings in the upper-right corner to adjust parameters for this hit test.

![](https://static-docs.nocobase.com/ai-employees/knowledge-base/knowledge-base/2026-06-12/hit-tests-settings.png)

Top K controls the maximum number of matched segments. Score controls the minimum similarity threshold, and results below this value are filtered out. Default parameters are Top K = 4 and Score = 0.6.

## Debug with test results

Hit tests help determine whether the knowledge base is ready for RAG.

Common adjustments:

- Target document is not matched: check whether vectorization succeeded, or lower Score to see weakly related results
- Irrelevant content is matched: increase Score, or disable/delete noisy segments
- Matched content is too long or too short: return to Segments, adjust segmentation parameters, and regenerate segments
- Common user phrasings are not matched: add Related questions in segment details

After modifying segments, wait for vectorization to finish, then return to Hit tests and test again.
