---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "Configuración"
description: "Modify basic information, vector store, and default segmentation settings on the Settings page of a knowledge base."
keywords: "knowledge base settings,segmentation settings,Chunk size,Chunk overlap,vector store,NocoBase"
---
# Configuración

## Open the Settings page

After opening the knowledge base detail page, click Settings in the left sidebar. This page modifies basic information, file storage, vector store, and default segmentation settings of the current knowledge base.

![](https://static-docs.nocobase.com/ai-employees/knowledge-base/knowledge-base/2026-06-12/kb-settings.png)

## Basic information

Local knowledge base settings include Key, Name, File storage, Vector store, Description, and Enabled status. File storage cannot be changed after creation.

If you modify Vector store, NocoBase asks for confirmation. After vector store changes, existing documents must be vectorized again before they can be written to the new vector store. You can choose Save and vectorize to save and vectorize immediately, or choose Save only and later run Vectorization manually on the Documents page.

## Default segmentation parameters

The Settings page includes three segmentation parameters:

| Setting | Default | Description |
| --- | --- | --- |
| Split document | Enabled | Whether uploaded documents are automatically split into multiple segments |
| Chunk size | 6000 | Maximum character count of each segment |
| Chunk overlap | 1200 | Overlapping character count between adjacent segments |

Chunk overlap cannot be greater than or equal to Chunk size. If the value is invalid, the backend normalizes it to keep overlap smaller than a single segment.

## Relation to document-level segment settings

These settings are knowledge-base-level defaults. They mainly affect documents uploaded or regenerated later.

After a document enters the knowledge base, it keeps its own segmentation parameters. On the Documents page, click Segments for a document, then open Segment settings to set Split document, Chunk size, and Chunk overlap for that document and run Resegment.

Existing generated segments are not automatically rebuilt after knowledge-base-level defaults change. To apply new parameters to an existing document, open its Segment settings and run Resegment.

:::warning Note

Resegment discards manually edited segment content and related questions in that document. Changing knowledge-base-level defaults does not immediately overwrite existing segments; only document-level Resegment rebuilds segments.

:::

## When to adjust parameters

Default parameters cover most plain text, Markdown, Word, and PDF documents. Adjust them only when segments are too long, too short, sentence breaks are obvious between adjacent segments, or you want the whole document to be one retrieval unit.

After saving settings, newly uploaded documents use the new default parameters.
