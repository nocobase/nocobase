/**
 * The text of intake files, for the rule parser. Plain-text formats are decoded as UTF-8; Office, OpenDocument, RTF
 * and PDF files go through `officeparser` (the same library and major version NocoProject used, already in this
 * workspace through the AI employee library). Its AST keeps headings and lists, which are written back as Markdown
 * (`#`, `-` with indentation) so the parser sees a document's outline; a sheet becomes CSV when its first row has a
 * title column, and a list of rows otherwise. Legacy binary Office files, images and anything else are not read:
 * only their names count.
 *
 * Each file is cut at `INTAKE_FILE_CHARS`, all of them together at `INTAKE_TOTAL_CHARS`, and one extraction may take
 * `EXTRACT_TIMEOUT_MS`.
 */
import {
  INTAKE_FILE_CHARS,
  INTAKE_TOTAL_CHARS,
  type IntakeReadState,
} from '../../../../shared/intake.js';

export const EXTRACT_TIMEOUT_MS = 15_000;

const TEXT_EXTENSIONS = new Set([
  'txt',
  'md',
  'markdown',
  'csv',
  'tsv',
  'json',
  'yaml',
  'yml',
  'log',
]);
const OFFICE_EXTENSIONS = new Set([
  'docx',
  'pptx',
  'xlsx',
  'odt',
  'odp',
  'ods',
  'rtf',
  'pdf',
]);
const LEGACY_EXTENSIONS = new Set(['doc', 'xls', 'ppt']);
const IMAGE_EXTENSIONS = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'bmp',
  'svg',
  'heic',
  'tif',
  'tiff',
]);

/** A stored intake file, as far as reading it goes. */
export interface IntakeSource {
  readonly id: string;
  readonly filename: string;
  readonly ext: string;
  readonly mimeType: string;
}

export interface IntakeDocument {
  readonly fileId: string;
  readonly filename: string;
  readonly text: string;
}

export interface IntakeTexts {
  /** The files that gave text, in the order given. */
  readonly documents: readonly IntakeDocument[];
  /** Every file's outcome, in the order given. */
  readonly reads: readonly {
    readonly fileId: string;
    readonly filename: string;
    readonly state: IntakeReadState;
    readonly chars: number;
  }[];
}

/** Turns an Office, OpenDocument, RTF or PDF file into outline text; the default uses `officeparser`. */
export type ExtractOffice = (bytes: Uint8Array) => Promise<string>;

type Kind = 'text' | 'office' | 'legacy' | 'image' | 'other';

function kindOf(file: IntakeSource): Kind {
  const ext = file.ext.toLowerCase();
  if (TEXT_EXTENSIONS.has(ext) || file.mimeType.startsWith('text/'))
    return 'text';
  if (OFFICE_EXTENSIONS.has(ext)) return 'office';
  if (LEGACY_EXTENSIONS.has(ext)) return 'legacy';
  if (IMAGE_EXTENSIONS.has(ext) || file.mimeType.startsWith('image/'))
    return 'image';
  return 'other';
}

function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(
      () => reject(new Error('Text extraction timed out.')),
      ms,
    );
  });
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
}

/** Collapses the blank-line runs extraction leaves behind. */
export function tidy(text: string): string {
  return text
    .replace(/\r\n?/gu, '\n')
    .replace(/[ \t]+\n/gu, '\n')
    .replace(/\n{3,}/gu, '\n\n')
    .trim();
}

/** The part of `officeparser`'s AST this file reads. */
export interface OutlineNode {
  readonly type: string;
  readonly text?: string;
  readonly children?: readonly OutlineNode[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

function quoteCsv(cell: string): string {
  return /[",\n]/u.test(cell) ? `"${cell.replace(/"/gu, '""')}"` : cell;
}

const TITLE_HEADERS = new Set(['title', 'name', '标题', '任务']);

function sheetText(sheet: OutlineNode): string {
  const rows = (sheet.children ?? [])
    .filter((row) => row.type === 'row')
    .map((row) => (row.children ?? []).map((cell) => (cell.text ?? '').trim()))
    .filter((cells) => cells.some(Boolean));
  const header = rows[0] ?? [];
  if (header.some((cell) => TITLE_HEADERS.has(cell.toLowerCase())))
    return rows.map((cells) => cells.map(quoteCsv).join(',')).join('\n');
  return rows
    .map((cells) => `- ${cells.filter(Boolean).join(' · ')}`)
    .join('\n');
}

/**
 * An `officeparser` AST as Markdown-like text: headings with `#`, list items with `-` indented by their level,
 * paragraphs separated by blank lines, sheets as CSV or as a list, and the content of slides and pages in order.
 */
export function outlineText(nodes: readonly OutlineNode[]): string {
  const lines: string[] = [];
  const visit = (node: OutlineNode): void => {
    const text = (node.text ?? '').replace(/\s+/gu, ' ').trim();
    switch (node.type) {
      case 'heading': {
        const level = Number(node.metadata?.level ?? 1);
        if (text)
          lines.push(
            '',
            `${'#'.repeat(Math.min(Math.max(level, 1), 6))} ${text}`,
          );
        return;
      }
      case 'list': {
        const indentation = Number(node.metadata?.indentation ?? 0);
        if (text)
          lines.push(`${'  '.repeat(Math.max(indentation, 0))}- ${text}`);
        return;
      }
      case 'paragraph':
        if (text) lines.push('', text);
        return;
      case 'sheet':
        lines.push('', sheetText(node), '');
        return;
      case 'slide':
      case 'page':
      case 'note':
        lines.push('');
        for (const child of node.children ?? []) visit(child);
        return;
      case 'table':
        for (const row of node.children ?? [])
          lines.push(
            (row.children ?? [])
              .map((cell) => (cell.text ?? '').replace(/\s+/gu, ' ').trim())
              .filter(Boolean)
              .join(' · '),
          );
        return;
      case 'image':
      case 'chart':
      case 'drawing':
      case 'break':
        return;
      default:
        if (node.children && node.children.length > 0)
          for (const child of node.children) visit(child);
        else if (text) lines.push(text);
    }
  };
  for (const node of nodes) visit(node);
  return tidy(lines.join('\n'));
}

/** The default `ExtractOffice`: `officeparser`, loaded on first use, without OCR or attachments. */
export const extractWithOfficeParser: ExtractOffice = async (bytes) => {
  const { parseOffice } = await import('officeparser');
  const ast = await parseOffice(Buffer.from(bytes), {
    outputErrorToConsole: false,
    extractAttachments: false,
    ocr: false,
  });
  const outline = outlineText(ast.content as readonly OutlineNode[]);
  return outline || ast.toText();
};

export interface IntakeTextReaderOptions<F extends IntakeSource> {
  /** Reads a stored file's bytes. */
  readonly load: (file: F) => Promise<Uint8Array>;
  readonly extract?: ExtractOffice;
  readonly perFileChars?: number;
  readonly totalChars?: number;
  readonly timeoutMs?: number;
}

/** Reads the files one by one (extraction is CPU-bound and there are at most ten), within the character budget. */
export async function readIntakeTexts<F extends IntakeSource>(
  files: readonly F[],
  options: IntakeTextReaderOptions<F>,
): Promise<IntakeTexts> {
  const extract = options.extract ?? extractWithOfficeParser;
  const perFile = options.perFileChars ?? INTAKE_FILE_CHARS;
  const timeoutMs = options.timeoutMs ?? EXTRACT_TIMEOUT_MS;
  let budget = options.totalChars ?? INTAKE_TOTAL_CHARS;
  const documents: IntakeDocument[] = [];
  const reads: IntakeTexts['reads'][number][] = [];
  for (const file of files) {
    const read = (state: IntakeReadState, chars = 0) =>
      reads.push({ fileId: file.id, filename: file.filename, state, chars });
    const kind = kindOf(file);
    if (kind === 'legacy') read('legacy');
    else if (kind === 'image') read('image');
    else if (kind === 'other') read('unsupported');
    else if (budget <= 0) read('skipped');
    else {
      let text: string;
      try {
        const bytes = await withTimeout(options.load(file), timeoutMs);
        text = tidy(
          kind === 'text'
            ? new TextDecoder('utf-8').decode(bytes)
            : await withTimeout(extract(bytes), timeoutMs),
        );
      } catch {
        read('failed');
        continue;
      }
      if (!text) {
        read('empty');
        continue;
      }
      const limit = Math.min(perFile, budget);
      const truncated = text.length > limit;
      const kept = truncated ? text.slice(0, limit) : text;
      budget -= kept.length;
      documents.push({ fileId: file.id, filename: file.filename, text: kept });
      read(truncated ? 'truncated' : 'read', kept.length);
    }
  }
  return { documents, reads };
}
