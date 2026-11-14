# @nocobase/document-extractor

## 0.1.0-beta.2

### Patch Changes

- dd0a34f: Keep fresh production installations on patched argparse 1 and ansi-regex 5 releases. Upgrading argparse within its compatible major removes the vulnerable Lodash 3 dependency without forcing Lodash across major versions.
- dd0a34f: Resolve a patched PDF.js release for officeparser document extraction and verify PDF text extraction with its local worker.
- dd0a34f: Use the npm-published @e965/xlsx 0.20.3 distribution of SheetJS to fix prototype pollution and regular expression denial of service while preserving XLS, XLSM, XLSX and CSV extraction. Registry dependencies allow applications to install with pnpm's default subdependency protections.

## 0.1.0-beta.1

### Patch Changes

- d88875e: Configure per-disk upload limits through Drive, validate issue, comment and conversation attachments with shared File helpers, and use the same limits for issue, comment and conversation upload checks and messages.

  Conversation attachment size errors now use `FILE_TOO_LARGE` in the `file` domain instead of `UPLOAD_TOO_LARGE` in `agents`. Online Agent attachment reading follows the stored disk limit.

  Upload limits are embedded in the page’s public configuration, so client startup requires no separate upload-policy request.

## 0.1.0-beta.0

### Minor Changes

- d490379: Share Knowledge's local PDF, Office, spreadsheet and text parsers in a Worker-isolated extraction library with bounded input, output, concurrency and cancellation. Preserve Knowledge's public parsing entry points, custom extractor injection, default Markdown output and version text persistence.

  Report actual-text availability separately from generated PDF or slide headings. Provide an option to omit embedded DOCX image bytes before applying text budgets while retaining Knowledge's default Markdown images and detecting image-only documents without treating image markup as readable text.

## 0.0.1

- Extract local documents using Worker-isolated parsers shared by application consumers.
- Report actual-text availability separately from generated PDF/slide headings without changing Markdown output.
