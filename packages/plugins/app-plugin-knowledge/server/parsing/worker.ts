/**
 * Extracting a file's text as Markdown, run in a worker thread (`index.ts`) so that a large or hostile file never
 * blocks the server: PDF (pdf-parse's pdf.js, a section per page), DOCX (mammoth), DOC (word-extractor), XLSX, XLS, XLSM and CSV
 * (SheetJS, a section per sheet, rows as tables of at most `ROWS_PER_TABLE`), PPTX (officeparser, a section per slide),
 * and plain text, Markdown and JSON as they are. No OCR: a scanned PDF gives little or no text.
 *
 * Self-contained on purpose: it imports packages only, so the worker loads it as it is, compiled or as TypeScript.
 */
import { createRequire } from 'node:module';
import { isMainThread, parentPort, workerData } from 'node:worker_threads';

/** What the worker is sent. */
export interface ExtractRequest {
  readonly bytes: Uint8Array;
  /** Lower-case, without the dot. */
  readonly ext: string;
}

/** What the worker answers. */
export type ExtractResponse =
  | { readonly status: 'ready'; readonly markdown: string }
  | { readonly status: 'unsupported' }
  | { readonly status: 'failed'; readonly error: string };

/** The data the worker is started with, so that only the knowledge base's own worker answers messages. */
export const WORKER_MARK = '@nocobase/app-plugin-knowledge/parser';

const ROWS_PER_TABLE = 50;

const decode = (bytes: Uint8Array) =>
  new TextDecoder('utf-8').decode(bytes).replace(/^\uFEFF/u, '');

/** A cell's text: SheetJS gives strings (`raw: false`), anything else is written as JSON. */
const cell = (value: unknown) =>
  (typeof value === 'string' ? value : (JSON.stringify(value) ?? ''))
    .replace(/\r?\n/gu, ' ')
    .replace(/\|/gu, '\\|')
    .trim();

/** Rows as Markdown tables of at most `ROWS_PER_TABLE` rows each, the first row repeated as every table's header. */
export function rowsToMarkdown(rows: readonly (readonly unknown[])[]): string {
  const trimmed = rows
    .map((row) => {
      let end = row.length;
      while (end > 0 && cell(row[end - 1]) === '') end -= 1;
      return row.slice(0, end);
    })
    .filter((row) => row.length > 0);
  if (trimmed.length === 0) return '';
  const width = Math.max(...trimmed.map((row) => row.length));
  const line = (row: readonly unknown[]) =>
    `| ${Array.from({ length: width }, (_, index) => cell(row[index])).join(' | ')} |`;
  const [header, ...body] = trimmed;
  const head = [line(header), `|${' --- |'.repeat(width)}`];
  if (body.length === 0) return head.join('\n');
  const tables: string[] = [];
  for (let at = 0; at < body.length; at += ROWS_PER_TABLE)
    tables.push(
      [...head, ...body.slice(at, at + ROWS_PER_TABLE).map(line)].join('\n'),
    );
  return tables.join('\n\n');
}

async function sheets(bytes: Uint8Array, csv: boolean): Promise<string> {
  const XLSX = await import('xlsx');
  const workbook = csv
    ? XLSX.read(decode(bytes), { type: 'string', raw: true })
    : XLSX.read(bytes, { type: 'array', cellText: true });
  const parts: string[] = [];
  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    if (!sheet) continue;
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      raw: false,
      defval: '',
      blankrows: false,
    });
    const table = rowsToMarkdown(rows);
    if (!table) continue;
    parts.push(csv ? table : `## ${name}\n\n${table}`);
  }
  return parts.join('\n\n');
}

interface PdfTextItem {
  readonly str: string;
  readonly transform: readonly number[];
}

/** pdf.js as pdf-parse bundles it, as far as reading text goes. */
interface PdfJs {
  disableWorker: boolean;
  verbosity: number;
  getDocument(source: {
    readonly data: Uint8Array;
    readonly isEvalSupported: boolean;
  }): Promise<{
    readonly numPages: number;
    getPage(number: number): Promise<{
      getTextContent(): Promise<{ readonly items: readonly PdfTextItem[] }>;
    }>;
    destroy(): Promise<void>;
  }>;
}

async function pdf(bytes: Uint8Array): Promise<string> {
  // pdf-parse's bundled pdf.js, required and given the bytes as `data`: handed a Buffer, it misreads some documents.
  const pdfjs = createRequire(import.meta.url)(
    'pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js',
  ) as PdfJs;
  pdfjs.disableWorker = true;
  pdfjs.verbosity = 0;
  let document: Awaited<ReturnType<PdfJs['getDocument']>>;
  try {
    document = await pdfjs.getDocument({ data: bytes, isEvalSupported: false });
  } catch (error) {
    const failure = error as { name?: string; message?: string };
    if (
      failure?.name === 'PasswordException' ||
      /password/iu.test(failure?.message ?? '')
    )
      throw new Error('The PDF is password-protected.', { cause: error });
    throw error;
  }
  const pages: string[] = [];
  try {
    for (let number = 1; number <= document.numPages; number += 1) {
      const content = await (await document.getPage(number)).getTextContent();
      // A new line where the text moves down, as pdf-parse renders a page.
      let lastY: number | undefined;
      let text = '';
      for (const item of content.items) {
        const y = item.transform[5];
        text += lastY === undefined || lastY === y ? item.str : `\n${item.str}`;
        lastY = y;
      }
      pages.push(
        text
          .split('\n')
          .map((line) => line.trimEnd())
          .join('\n')
          .trim(),
      );
    }
  } finally {
    await document.destroy().catch(() => undefined);
  }
  if (pages.length <= 1) return pages[0] ?? '';
  return pages
    .map((text, index) => `## Page ${index + 1}\n\n${text}`)
    .join('\n\n');
}

async function docx(bytes: Uint8Array): Promise<string> {
  const mammoth = (await import('mammoth')).default as unknown as {
    convertToMarkdown(input: {
      buffer: Buffer;
    }): Promise<{ readonly value: string }>;
  };
  const { value } = await mammoth.convertToMarkdown({
    buffer: Buffer.from(bytes),
  });
  // mammoth escapes punctuation Markdown would not misread, and anchors each bookmark; the text reads better without.
  return value
    .replace(/<a id="[^"]*"><\/a>/gu, '')
    .replace(/\\([.()!\-_#+])/gu, '$1');
}

/** word-extractor, which ships no types, as far as it is used here. */
type WordExtractor = new () => {
  extract(input: Buffer): Promise<{ getBody(): string }>;
};

async function doc(bytes: Uint8Array): Promise<string> {
  const Extractor = createRequire(import.meta.url)(
    'word-extractor',
  ) as WordExtractor;
  const extracted = await new Extractor().extract(Buffer.from(bytes));
  return extracted.getBody();
}

interface OfficeNode {
  readonly type: string;
  readonly text?: string;
  readonly children?: readonly OfficeNode[];
}

async function pptx(bytes: Uint8Array): Promise<string> {
  const { OfficeParser } = await import('officeparser');
  const ast = await OfficeParser.parseOffice(Buffer.from(bytes), {
    ocr: false,
  });
  const nodes = ast.content as readonly OfficeNode[];
  const slides = nodes.filter((node) => node.type === 'slide');
  if (slides.length === 0) return ast.toText();
  return slides
    .map((slide, index) => {
      const lines = (slide.children ?? [])
        .map((child) => child.text?.trim() ?? '')
        .filter(Boolean);
      return [`## Slide ${index + 1}`, ...lines].join('\n\n');
    })
    .join('\n\n');
}

/** The file's text as Markdown; `unsupported` for a type whose text is not extracted. */
export async function extractText(
  request: ExtractRequest,
): Promise<ExtractResponse> {
  const { bytes } = request;
  let markdown: string;
  switch (request.ext) {
    case 'pdf':
      markdown = await pdf(bytes);
      break;
    case 'docx':
      markdown = await docx(bytes);
      break;
    case 'doc':
      markdown = await doc(bytes);
      break;
    case 'xlsx':
    case 'xls':
    case 'xlsm':
      markdown = await sheets(bytes, false);
      break;
    case 'csv':
      markdown = await sheets(bytes, true);
      break;
    case 'pptx':
      markdown = await pptx(bytes);
      break;
    case 'txt':
    case 'md':
      markdown = decode(bytes);
      break;
    case 'json': {
      const text = decode(bytes);
      let pretty = text;
      try {
        pretty = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        // Kept as it is: invalid JSON is still text.
      }
      markdown = `\`\`\`json\n${pretty}\n\`\`\``;
      break;
    }
    default:
      return { status: 'unsupported' };
  }
  return {
    status: 'ready',
    markdown: markdown
      .replace(/\r\n/gu, '\n')
      .replace(/\n{3,}/gu, '\n\n')
      .trim(),
  };
}

const marked =
  !isMainThread &&
  typeof workerData === 'object' &&
  workerData !== null &&
  (workerData as { mark?: unknown }).mark === WORKER_MARK;

if (marked)
  parentPort?.once('message', (request: ExtractRequest) => {
    void extractText(request)
      .catch((error: unknown): ExtractResponse => ({
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      }))
      .then((response) => parentPort?.postMessage(response));
  });
