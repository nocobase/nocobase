---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "Управление документами"
description: "Upload documents, view status, run vectorization, download, or delete documents on the Documents page of a knowledge base."
keywords: "knowledge base documents,document upload,vectorization,ZIP import,NocoBase"
---

# Управление документами

## Open the Documents page

After opening the knowledge base detail page, click Documents in the left sidebar. This page manages documents in the current knowledge base and is also the entry point for segment management.

![](https://static-docs.nocobase.com/ai-employees/knowledge-base/knowledge-base/2026-06-12/documents.png)

## Upload documents

Click Upload in the upper-right corner to upload files. After upload, documents automatically enter segment generation and vectorization. Status first shows Pending, then changes to Success after processing. If processing fails, it shows Error, and an error icon appears next to the filename.

Supported document types include: `txt`, `md`, `json`, `csv`, `xls`, `xlsx`, `pdf`, `doc`, `docx`, `ppt`, and `pptx`.

:::tip PDF documents

PDF only supports plain text content. If the PDF mainly contains scanned images, run OCR first and upload a file with extractable text.

:::

## Batch import

To import multiple documents at once, package them as a ZIP file and upload it. NocoBase extracts the ZIP in the background and imports the documents into the current knowledge base.

:::tip Upload size limit

ZIP import is also limited by the upload size configured for the file storage. If the upload reports that the file is too large, adjust the limit in the File storage used by this knowledge base. See [File storage](../../../file-manager/storage/) for the related configuration.

:::

## View processing results

Common fields in the document list:

| Field | Meaning |
| --- | --- |
| Filename | Uploaded filename |
| Status | Current vectorization status, usually Pending, Success, or Error |
| Characters | Total number of enabled segment characters |
| Segments | Number of segments generated from the document |
| Created at / Updated at | Creation time and latest update time |

If a document stays in Pending for a long time, click Refresh first. If it still does not finish, check background tasks, vector store, and LLM service availability.

## Run vectorization

After selecting documents in the list, click Vectorization above the list to rerun vectorization for the selected documents. If no document is selected, clicking Vectorization processes all documents in the current knowledge base.

The row-level Vectorization action only processes the current document. It is usually used in these scenarios:

- Vector store or vector database configuration changed
- A document is in Error status and needs to be retried after the configuration is fixed
- Segments were manually edited, disabled, or deleted, and the new vector data needs to take effect

:::tip

Editing, disabling, or deleting segments in segment management automatically triggers a new vectorization task. It is normal for the document status to briefly become Pending.

:::

## Download and delete

Each row has three common actions:

- Segments opens segment management for the current document
- Download downloads the original document
- Delete deletes the document and cleans up related segments and vector data

The Delete button above the list deletes selected documents in batch. Deletion cannot be undone, so confirm the documents are no longer needed before deleting them.
