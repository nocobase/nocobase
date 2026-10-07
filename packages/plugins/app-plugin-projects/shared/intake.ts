/**
 * Requirement intake, the New issue dialog's "AI draft" tab: a description, meeting notes or a CSV, and up to
 * `INTAKE_FILES_MAX` files, become a draft of new issues that the person edits row by row and then creates together.
 * The draft is kept as a pending operation plan of `issue.create` rows (`shared/plans.ts`), so creating is checked
 * first and happens in one transaction; it is never listed anywhere else. The split here uses rules only — no model —
 * so it answers at once. AI splits, revises and breaks down through the organiser the application binds
 * (`shared/intake-ai.ts`), and an agent can be asked to organize the same input into a plan of its own in a
 * conversation (the application fills the AI draft tab's slot for that).
 *
 * ## Rules (`server/domains/plans/intake/intake.parser.ts`)
 *
 * - A heading line (`#` … `######`) is a parent issue; the lines under it belong to it.
 * - A list line (`-`, `*`, `+`, `1.`, `1)`, optionally a `[ ]` / `[x]` checkbox) is an issue. Indented by two or more
 *   spaces (a tab counts as four), it is a sub-issue of the list line above it; otherwise of the current heading.
 * - A plain line right after an issue (no blank line between) adds to its description.
 * - Plain paragraphs separated by blank lines are one issue each: the first line is the title, the rest the
 *   description.
 * - In a title: `[urgent]` `[high]` `[medium]` `[low]` or a standalone `!!` (urgent) / `!` (high) set the priority;
 *   `#tag` adds a label (an existing label of that name; others are reported in `unknownLabels`); `@stage2` or
 *   `(stage 2)` set the stage of a sub-issue. The markers are removed from the title.
 * - A title longer than 200 characters is cut, the full text kept at the top of the description.
 * - CSV: when the first non-empty line has a `title` column, every row is an issue read by column (`title`,
 *   `description`, `priority`, `labels` separated by `;` or `|`, `stage`, `parent`: the title of an earlier row).
 *
 * The text and every readable file are split separately and the issues joined in that order. Files are read as text
 * (txt, md, csv, …) or extracted (docx, xlsx, pptx, pdf, odt, ods, odp, rtf; headings and lists keep their shape);
 * images and other files contribute only their names.
 *
 * ## HTTP API (`/api/projects/intake`, signed in)
 *
 * | Method and path                | Body                     | Answer                                          |
 * | ------------------------------ | ------------------------ | ----------------------------------------------- |
 * | `POST /intake/files`           | multipart, one `file`    | 201 `{ data: IntakeFile }`; 413 over the limit  |
 * | `DELETE /intake/files/{fileId}`|                          | 204; only the uploader's own files              |
 * | `POST /intake/split`           | `IntakeSplitRequest`     | 200 `{ data: IntakeSplitResult }`               |
 * | `POST /intake/extractTexts`    | `IntakeTextsRequest`     | 200 `{ data: IntakeTextsResult }`               |
 *
 * `extractTexts` reads the caller's files as the split would, without splitting: what an agent asked to organize the
 * same input is handed (the application's "Let an agent organize").
 *
 * Errors are the standard error body with domain `projects`: 400 `INVALID_INTAKE` (empty, too long, too many files),
 * 400 `INVALID_FILE` (not an upload of the caller's), 400 `FAILED_PRECONDITION` `FILES_UNAVAILABLE` (the application
 * has no file plugin), 413 `FILE_TOO_LARGE`.
 */
import type { CreatePlanRequest, Plan, PlanRehearsal } from './plans.js';

/** The longest text the page accepts, in characters. */
export const INTAKE_TEXT_MAX = 50_000;
export const INTAKE_FILES_MAX = 10;
/** Per file, in bytes. */
export const INTAKE_FILE_SIZE_MAX: number = 20 * 1024 * 1024;
/** What one file may contribute to the split, in characters. */
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
 * What the split made of a file: `read` or `truncated` (cut at `INTAKE_FILE_CHARS` or the total), `empty` (no text),
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

/** `POST /intake/split`. At least some text or one file. */
export interface IntakeSplitRequest {
  /** At most `INTAKE_TEXT_MAX` characters. */
  readonly text?: string;
  /** The caller's own uploads (`POST /intake/files`), at most `INTAKE_FILES_MAX`. */
  readonly fileIds?: readonly string[];
  /** The project every issue goes to; each row can be changed afterwards. */
  readonly projectId?: string | null;
}

export interface IntakeSplitResult {
  /**
   * The stored plan, pending, decided by the caller (`source.kind` `intake`). Null when a row failed its rehearsal:
   * then `rehearsal` holds every row's check and `request` the rows, to be corrected and submitted with `POST /plans`.
   */
  readonly plan: Plan | null;
  readonly request: CreatePlanRequest;
  readonly rehearsal: PlanRehearsal | null;
  readonly files: readonly IntakeFileRead[];
  /** `#tags` that name no label; they were left out. */
  readonly unknownLabels: readonly string[];
  /** Issues beyond `PLAN_ROWS_MAX` that were left out. */
  readonly dropped: number;
}

/** `POST /intake/extractTexts`: the caller's own uploads, at most `INTAKE_FILES_MAX`. */
export interface IntakeTextsRequest {
  readonly fileIds: readonly string[];
}

/** A file's text, as the split reads it (within `INTAKE_FILE_CHARS` and `INTAKE_TOTAL_CHARS`). */
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

/**
 * `source.data` of an intake plan. When the plan is executed, its files become the created issues' files: each the
 * issue of the row its `fileRefs` names (the first issue its own text gave), the others the plan's first created issue.
 */
export interface IntakeSourceData {
  readonly fileIds: readonly string[];
  readonly projectId: string | null;
  /** File id → the ref of the row made from the file's own text. */
  readonly fileRefs?: Readonly<Record<string, string>>;
}
