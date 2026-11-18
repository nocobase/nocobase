/** The caller's own temporary uploads and their extracted text. */
export const INTAKE_FILES_MAX = 10;
/** Per file, in bytes. */
export const INTAKE_FILE_SIZE_MAX: number = 20 * 1024 * 1024;
/** What one file may contribute to the extracted text, in characters. */
export const INTAKE_FILE_CHARS = 20_000;
/** What all files together may contribute, in characters. */
export const INTAKE_TOTAL_CHARS = 60_000;

/** An uploaded intake file. */
export interface IntakeFile {
  readonly id: string;
  readonly filename: string;
  readonly ext: string;
  readonly mimeType: string;
  readonly size: number;
  readonly createdAt: string;
}

/**
 * What extraction made of a file: `read` or `truncated` (cut at `INTAKE_FILE_CHARS` or the total), `empty` (no text),
 * `image` and `unsupported` (only the name counts), `legacy` (doc, xls, ppt: not read), `failed` (could not be read),
 * `skipped` (the total was used up).
 */
export type IntakeReadState =
  | 'read'
  | 'truncated'
  | 'empty'
  | 'image'
  | 'unsupported'
  | 'legacy'
  | 'failed'
  | 'skipped';

export interface IntakeFileRead {
  readonly fileId: string;
  readonly filename: string;
  readonly state: IntakeReadState;
  /** Characters used. */
  readonly chars: number;
}

/** `POST /intake/extractTexts`: the caller's own uploads, at most `INTAKE_FILES_MAX`. */
export interface IntakeTextsRequest {
  readonly fileIds: readonly string[];
}

/** A file's text (within `INTAKE_FILE_CHARS` and `INTAKE_TOTAL_CHARS`). */
export interface IntakeFileText {
  readonly fileId: string;
  readonly filename: string;
  readonly text: string;
}

export interface IntakeTextsResult {
  /** The files that gave text, in the order named. */
  readonly documents: readonly IntakeFileText[];
  /** Every file's outcome, in the order named. */
  readonly files: readonly IntakeFileRead[];
}
