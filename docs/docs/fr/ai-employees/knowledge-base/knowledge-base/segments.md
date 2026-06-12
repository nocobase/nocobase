---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "Gestion des segments"
description: "Open the Segments dialog from the Documents page to view, edit, disable, delete, and regenerate document segments."
keywords: "knowledge base segments,Segments,Chunk size,Chunk overlap,related questions,NocoBase"
---
# Gestion des segments

## Open segment management

Open the knowledge base Documents page, then click Segments on the right side of a document. The Segment management dialog shows all segments generated for the current document.

![](https://static-docs.nocobase.com/ai-employees/knowledge-base/knowledge-base/2026-06-12/segments-list.png)

## View the segment list

The segment list shows the segment number, content preview, character count, related question count, enabled status, and latest update time. After Enabled only is turned on, the list only shows enabled segments. This switch only affects display and does not modify segment data.

## Edit a segment

Click Edit on the right side of a segment to open its detail view.

![](https://static-docs.nocobase.com/ai-employees/knowledge-base/knowledge-base/2026-06-12/segment-edit.png)

You can edit Content and Related questions. Related questions enter vector retrieval together with the segment. For example, if the body text is a policy clause, you can add several natural-language questions employees may ask to make matching more stable.

After saving, NocoBase updates the segment file and triggers vectorization for the current document. When you return to the Documents list, the status may briefly show Pending.

## Enable, disable, and delete segments

The Enabled switch controls whether a single segment participates in retrieval. Enabled segments are written to the vector store and can be retrieved by RAG and hit tests. Disabled segments remain in the list but do not participate in later vectorization or retrieval.

Click Delete to delete the current segment and its vector data. After deletion, the document segment count and character count are recalculated.

:::warning Note

Disabling or deleting a segment triggers vectorization again. Before processing finishes, the document status may show Pending.

:::

## Regenerate segments

Click Segment settings in the upper-right corner to reset segmentation parameters for the current document.

![](https://static-docs.nocobase.com/ai-employees/knowledge-base/knowledge-base/2026-06-12/segments-settings-popover.png)

The settings include Split document, Chunk size, and Chunk overlap. Click Resegment to regenerate segments with the current parameters.

:::warning Note

Regenerating segments discards manually edited segment content and related questions. Only run this action when you are sure the document should be rebuilt with new parameters.

:::
