# @nocobase/document-extractor

Local document text extraction in bounded Node Workers. Supports PDF, DOC, DOCX, XLS, XLSX, XLSM, PPTX, TXT, MD, JSON and CSV without OCR. This package owns no storage, permissions, model selection or remote upload.

```ts
import { workerExtractor } from '@nocobase/document-extractor';
const extract = workerExtractor();
const result = await extract(
  { bytes, ext: 'docx' },
  { signal, maxOutputChars: 100_000, omitEmbeddedImages: true },
);
```

Successful built-in results include `hasText`, distinguishing actual extracted text from generated page/slide headings while preserving the existing Markdown representation. A nonempty document with only headings is not evidence that its contents were read. The field is optional in the shared `TextExtractor` contract so existing custom extractors remain assignable; callers apply their own readability policy when it is omitted.

Set `omitEmbeddedImages: true` for text-only DOCX extraction. It skips embedded image conversion without reading or base64-encoding image bytes, so images cannot consume the text budget. The default is `false`, preserving existing Markdown image representations for callers such as Knowledge. DOCX `hasText` inspects actual document text nodes independently of image markup; an image-only document is not readable text. This option does not perform OCR.
The default deadline is five minutes including queue time, with two running Workers, 32 waiting requests and 100 MiB per input. Cancellation and timeouts wait for Worker termination. Caller-owned bytes are never transferred. Output over budget fails rather than truncating. Workers isolate CPU work, not all memory allocations or hostile document behavior; they are not security sandboxes. Import `/formats` for browser-safe format information.
