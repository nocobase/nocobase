import { FileInputError } from './errors.js';
import { isParsed } from '@nocobase/document-extractor';
import { CHAT_ATTACHMENT_SIZE_MAX } from '../../../shared/conversations.js';

const mimeExtensions: Readonly<Record<string, string>> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel.sheet.macroenabled.12': 'xlsm',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    'pptx',
  'text/plain': 'txt',
  'text/markdown': 'md',
  'text/csv': 'csv',
  'application/json': 'json',
};

export function characters(text: string): number {
  let count = 0;
  for (const _ of text) count += 1;
  return count;
}

export function localExtension(
  filename: string,
  mediaType: string,
  storedExt?: string,
): string {
  const named = filename.includes('.')
    ? filename.split('.').at(-1)!.toLowerCase()
    : undefined;
  const mime = mimeExtensions[mediaType];
  const ext = storedExt?.toLowerCase() || named || mime;
  if (
    !ext ||
    !isParsed(ext) ||
    (!mime && mediaType !== 'application/octet-stream')
  )
    throw new FileInputError(
      mediaType.startsWith('image/') ? 'imageCapability' : 'unsupportedFormat',
    );
  const plainTextAlias =
    mime === 'txt' && ['txt', 'md', 'json', 'csv'].includes(ext);
  if (mime && mime !== ext && !plainTextAlias)
    throw new FileInputError('formatMismatch');
  return ext;
}

export function inlineBytes(url: string, mediaType: string): Uint8Array {
  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/]*={0,2})$/u.exec(url);
  if (
    !match ||
    match[1] !== mediaType ||
    match[2].length > Math.ceil(CHAT_ATTACHMENT_SIZE_MAX / 3) * 4
  )
    throw new FileInputError('invalidInline');
  const bytes = Buffer.from(match[2], 'base64');
  if (
    bytes.byteLength > CHAT_ATTACHMENT_SIZE_MAX ||
    bytes.toString('base64').replace(/=+$/u, '') !==
      match[2].replace(/=+$/u, '')
  )
    throw new FileInputError('invalidInline');
  return bytes;
}

export class ByteLimitError extends Error {}

export async function readBytes(
  body: ReadableStream<Uint8Array>,
  signal: AbortSignal,
): Promise<Uint8Array> {
  try {
    return await readBoundedBytes(body, signal, CHAT_ATTACHMENT_SIZE_MAX);
  } catch (error) {
    if (error instanceof ByteLimitError)
      throw new FileInputError('fileTooLarge');
    throw error;
  }
}
/** One bounded reader for authorized files and Provider responses, sharing the original cancellation. */
export async function readBoundedBytes(
  body: ReadableStream<Uint8Array>,
  signal: AbortSignal,
  maxBytes: number,
): Promise<Uint8Array> {
  const reader = body.getReader();
  let cancellation: Promise<void> | undefined;
  const cancel = () =>
    (cancellation ??= reader.cancel().catch(() => undefined));
  const abort = () => {
    void cancel();
  };
  signal.addEventListener('abort', abort, { once: true });
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    signal.throwIfAborted();
    while (true) {
      const { done, value } = await reader.read();
      signal.throwIfAborted();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes)
        throw new ByteLimitError('The input exceeds its byte budget.');
      chunks.push(value);
    }
    return Buffer.concat(chunks, size);
  } finally {
    await cancel();
    reader.releaseLock();
    signal.removeEventListener('abort', abort);
  }
}

/** Every occurrence counts as context, but repeated copies of one source count bytes once. */
export class FileInputBudget {
  static readonly maxOutputChars: number = 100_000;
  private readonly sources = new Set<string>();
  private bytes = 0;
  private textChars = 0;
  private nativeFiles = 0;

  constructor(
    fileCount: number,
    private readonly maxNativeFiles: number,
  ) {
    if (fileCount > 100) throw new FileInputError('fileCount');
  }

  native(): void {
    if (++this.nativeFiles > this.maxNativeFiles)
      throw new FileInputError('nativeFileCount');
  }

  source(key: string, bytes: number): void {
    if (!this.sources.has(key)) {
      this.sources.add(key);
      this.bytes += bytes;
    }
    if (this.bytes > 64 * 1024 * 1024)
      throw new FileInputError('inputTooLarge');
  }

  document(text: string): void {
    if (characters(text) > FileInputBudget.maxOutputChars)
      throw new FileInputError('documentTooLarge');
  }

  context(text: string): void {
    this.textChars += characters(text);
    if (this.textChars > 200_000) throw new FileInputError('contextTooLarge');
  }
}
