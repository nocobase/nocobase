# @nocobase/document-extractor

## 0.1.0-beta.0

### Minor Changes

- d490379: Share Knowledge's local PDF, Office, spreadsheet and text parsers in a Worker-isolated extraction library with bounded input, output, concurrency and cancellation. Preserve Knowledge's public parsing entry points, custom extractor injection, default Markdown output and version text persistence.

  Report actual-text availability separately from generated PDF or slide headings. Provide an option to omit embedded DOCX image bytes before applying text budgets while retaining Knowledge's default Markdown images and detecting image-only documents without treating image markup as readable text.

## 0.0.1

- Extract local documents using Worker-isolated parsers shared by application consumers.
- Report actual-text availability separately from generated PDF/slide headings without changing Markdown output.
