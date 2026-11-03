/** Bytes and descriptive metadata only; callers own authorization and storage. */
export interface ExtractRequest {
  readonly bytes: Uint8Array;
  readonly ext: string;
  readonly filename?: string;
  readonly mediaType?: string;
}
export interface ExtractOptions {
  readonly signal?: AbortSignal;
  readonly maxOutputChars?: number;
  /** Omit embedded DOCX images without reading/encoding their bytes; defaults to false. */
  readonly omitEmbeddedImages?: boolean;
}
export type ExtractResponse =
  | {
      readonly status: 'ready';
      readonly markdown: string;
      /** Excludes generated page/slide headings; omitted by older custom extractors. */ readonly hasText?: boolean;
    }
  | { readonly status: 'unsupported' }
  | {
      readonly status: 'failed';
      readonly error: string;
      readonly code?: 'aborted' | 'timeout' | 'too-large' | 'invalid-document';
    };
export type TextExtractor = (
  request: ExtractRequest,
  options?: ExtractOptions,
) => Promise<ExtractResponse>;
export interface WorkerExtractorOptions {
  readonly timeoutMs?: number;
  readonly concurrency?: number;
  readonly maxQueue?: number;
  readonly maxInputBytes?: number;
}
