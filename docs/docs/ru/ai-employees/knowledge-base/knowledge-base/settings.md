---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "Настройки"
description: "Modify basic information, vector store, and default segmentation settings on the Settings page of a knowledge base, and understand the relation between knowledge-base-level and document-level segmentation settings."
keywords: "knowledge base settings,segmentation settings,Chunk size,Chunk overlap,vector store,NocoBase"
---

# Настройки

## Open the Settings page

After opening the knowledge base detail page, click Settings in the left sidebar. This page modifies basic information, file storage, vector store, and default segmentation settings of the current knowledge base.

![](https://static-docs.nocobase.com/20260617005832.png)

## Basic information

Local knowledge base settings include:

| Setting | Description |
| --- | --- |
| Key | Unique identifier of the knowledge base. It cannot be changed after creation |
| Name | Knowledge base name |
| File storage | Where documents and segment files are stored. It cannot be changed after creation |
| Vector store | Vector store used by the current knowledge base |
| Description | Knowledge base description |
| Enabled | Whether the current knowledge base is enabled |

:::tip Vector store changes

After you modify Vector store, NocoBase asks for confirmation when saving. After the vector store changes, existing documents must be vectorized again before vector data can be written to the new vector store. Choose Save and vectorize to save the settings and vectorize immediately, or choose Save only to save the settings and later run Vectorization manually on the Documents page.

:::

![](https://static-docs.nocobase.com/20260617005951.png)

## Default segmentation parameters

The Settings page includes three segmentation parameters:

| Setting | Default | Description |
| --- | --- | --- |
| Split document | Enabled | Whether uploaded documents are automatically split into multiple segments |
| Chunk size | `6000` | Maximum character count of each segment |
| Chunk overlap | `1200` | Overlapping character count between adjacent segments |

Chunk overlap cannot be greater than or equal to Chunk size. If the value is invalid, the backend normalizes it to keep overlap smaller than a single segment.

## Relation to document-level segment settings

These settings are knowledge-base-level defaults. They mainly affect documents uploaded or regenerated later.

After a document enters the knowledge base, it keeps its own segmentation parameters. On the Documents page, click Segments for a document, then open Segment settings to set Split document, Chunk size, and Chunk overlap for that document and run Resegment.

The relation between the two places is:

- Segmentation parameters in Settings define the default strategy for the knowledge base and are suitable for controlling new documents consistently
- Segmentation parameters in the Segments dialog only apply to the current document and are suitable for handling a document that is too long, too short, or structurally special
- Existing generated segments are not automatically rebuilt after knowledge-base-level defaults change
- To apply new parameters to an existing document, open its Segment settings and run Resegment

:::warning Note

Resegment discards manually edited segment content and related questions in that document. Changing knowledge-base-level defaults does not immediately overwrite existing segments; only document-level Resegment rebuilds segments.

:::

## When to adjust parameters

Default parameters cover most plain text, Markdown, Word, and PDF documents. Adjust them only in these cases:

- Segments are too long and matched results include too much unrelated content: reduce Chunk size
- Segments are too short and context is incomplete: increase Chunk size
- Sentence breaks are obvious between adjacent segments: increase Chunk overlap
- You want the whole document to be one retrieval unit: turn off Split document

After saving settings, newly uploaded documents use the new default parameters.
