---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "Gestión de segmentos"
description: "Open the Segments dialog from the Documents page to view, edit, disable, delete, and regenerate document segments."
keywords: "knowledge base segments,Segments,Chunk size,Chunk overlap,related questions,NocoBase"
---

# Gestión de segmentos

:::tip Document segments

After a document is uploaded, NocoBase first splits the body into segments according to the segmentation parameters, then writes enabled segments into the vector store. RAG retrieval matches these segments, not the original whole document. Split document, Chunk size, and Chunk overlap affect the number of segments, context length, and continuity between adjacent segments.

:::

## Open segment management

Open the knowledge base Documents page, then click Segments on the right side of a document. The Segment management dialog shows all segments generated for the current document.

![](https://static-docs.nocobase.com/ai-employees/knowledge-base/knowledge-base/2026-06-12/segments-list.png)

## View the segment list

The segment list shows:

| Field | Meaning |
| --- | --- |
| No. | Segment number, starting from 1 |
| Preview | Segment content preview |
| Characters | Character count of the current segment |
| Related questions | Number of related questions configured for the current segment |
| Enabled | Whether the segment participates in vectorization and retrieval |
| Updated at | Latest segment update time |

After Enabled only is turned on, the list only shows enabled segments. This switch only affects display and does not modify segment data.

## Edit a segment

Click Edit on the right side of a segment to open its detail view.

![](https://static-docs.nocobase.com/ai-employees/knowledge-base/knowledge-base/2026-06-12/segment-edit.png)

You can edit:

- Content: segment body
- Related questions: additional searchable phrasings

:::tip Related questions

Related questions are used to add common phrasings for the current segment. They do not rewrite the segment body, but they participate in vector retrieval. If a user question closely matches a related question, the retrieval result returns the document segment associated with that related question.

:::

After saving, NocoBase updates the segment file and triggers vectorization for the current document. When you return to the Documents list, the status may briefly show Pending.

## Enable, disable, and delete segments

The Enabled switch controls whether a single segment participates in retrieval:

- Enabled: the segment is written to the vector store and can be retrieved by RAG and hit tests
- Disabled: the segment remains in the list but does not participate in later vectorization or retrieval

Click Delete to delete the current segment and its vector data. After deletion, the document segment count and character count are recalculated.

:::warning Note

Disabling or deleting a segment triggers vectorization again. Before processing finishes, the document status may show Pending.

:::

## Regenerate segments

Click Segment settings in the upper-right corner to reset segmentation parameters for the current document.

![](https://static-docs.nocobase.com/ai-employees/knowledge-base/knowledge-base/2026-06-12/segments-settings-popover.png)

The settings are:

- Split document: whether to split the document according to the parameters. When enabled, multiple segments are generated; when disabled, the whole document is used as one segment
- Chunk size: maximum number of characters in each segment, default `6000`. Smaller values create finer segments; larger values keep more context in a single matched result
- Chunk overlap: number of overlapping characters kept between adjacent segments, default `1200`. A reasonable overlap reduces context breaks at segment boundaries

Click Resegment to regenerate segments with the current parameters.

:::warning Note

Regenerating segments discards manually edited segment content and related questions. Only run this action when you are sure the document should be rebuilt with new parameters.

:::
