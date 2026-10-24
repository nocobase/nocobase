---
"@nocobase/document-extractor": minor
"@nocobase/app-plugin-knowledge": patch
---

Share Knowledge's local PDF, Office, spreadsheet and text parsers in a Worker-isolated extraction library with bounded input, output, concurrency and cancellation. Preserve Knowledge's public parsing entry points, custom extractor injection, default Markdown output and version text persistence.

Report actual-text availability separately from generated PDF or slide headings. Provide an option to omit embedded DOCX image bytes before applying text budgets while retaining Knowledge's default Markdown images and detecting image-only documents without treating image markup as readable text.
