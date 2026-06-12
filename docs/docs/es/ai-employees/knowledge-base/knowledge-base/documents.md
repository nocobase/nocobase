---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "Gestión de documentos"
description: "Upload documents, view status, run vectorization, download, or delete documents on the Documents page of a knowledge base."
keywords: "knowledge base documents,document upload,vectorization,ZIP import,NocoBase"
---
# Gestión de documentos

## Open the Documents page

After opening the knowledge base detail page, click Documents in the left sidebar. This page manages documents in the current knowledge base and is also the entry point for segment management.

![](https://static-docs.nocobase.com/ai-employees/knowledge-base/knowledge-base/2026-06-12/documents.png)

## Upload documents

Click Upload in the upper-right corner to upload files. After upload, documents automatically enter segment generation and vectorization. Status first shows Pending, then changes to Success after processing. If processing fails, it shows Error.

Supported document types include txt, md, json, csv, xls, xlsx, pdf, doc, docx, ppt, and pptx. PDF only supports plain text content. If the PDF mainly contains scanned images, run OCR first and upload a file with extractable text.

## Batch import

To import multiple documents at once, package them as a ZIP file and upload it. NocoBase extracts the ZIP in the background and imports the documents into the current knowledge base.

If a ZIP upload fails because the file is too large, check the upload size limit of the corresponding storage in File manager. Knowledge base uploads use the File storage configured in knowledge base settings, so adjust the same file storage.

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

Click Vectorization above the list to rerun vectorization for selected documents. If no documents are selected, vectorization runs for documents in the current knowledge base.

The row-level Vectorization action only processes the current document. It is usually used after vector store configuration changes, after an Error status is fixed, or after segments are manually edited, disabled, or deleted.

## Download and delete

Each row has three common actions:

- Segments opens segment management for the current document
- Download downloads the original document
- Delete deletes the document and cleans up related segments and vector data

The Delete button above the list deletes selected documents in batch. Deletion cannot be undone, so confirm the documents are no longer needed before deleting them.
