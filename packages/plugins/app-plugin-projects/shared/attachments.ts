/**
 * Files attached to issues and comments. A file is stored through the file plugin (its bytes on a Drive disk) and
 * starts out as an upload of its uploader's, attached to nothing; attaching it to an issue (the issue's own files) or
 * to a comment (sent with the comment) makes it readable by whoever sees the issue. An upload attached to nothing for
 * `ORPHAN_HOURS` is purged, and so are the files of a deleted comment. Any type of file is accepted, up to
 * `ATTACHMENT_SIZE_MAX` bytes each.
 *
 * ## Who may do what
 *
 * | Operation                                   | Needs                                                            |
 * | ------------------------------------------- | ---------------------------------------------------------------- |
 * | read, download, list                        | seeing the issue (an upload attached to nothing: its uploader)   |
 * | upload                                      | `pm.attachments` `upload`                                        |
 * | attach to an issue                          | `upload`, and `pm.issues` `edit` on the issue                    |
 * | send with a comment                         | `upload`, and `pm.issues` `comment` on the issue                 |
 * | remove an issue's file                      | its uploader (with `edit`), or `moderate-comments` on the issue  |
 * | remove a comment's file                     | deleting the comment                                             |
 *
 * ## HTTP API (`/api/projects`, signed in)
 *
 * | Method and path                          | Body                     | Answer                                           |
 * | ---------------------------------------- | ------------------------ | ------------------------------------------------ |
 * | `POST /attachments`                      | multipart, one `file`    | 201 `{ data: Attachment }`, attached to nothing  |
 * | `GET /attachments/{attachmentId}`        |                          | 200 `{ data: Attachment }`                       |
 * | `GET /attachments/{attachmentId}/content`| `?download=true` to save | the bytes; safe images inline, others saved      |
 * | `DELETE /attachments/{attachmentId}`     |                          | 204                                              |
 * | `GET /issues/{issueId}/attachments`      |                          | `{ data: Attachment[], meta: { total } }`        |
 * | `POST /issues/{issueId}/attachments`     | multipart, one `file`    | 201 `{ data: Attachment }`, attached to it       |
 *
 * `POST /issues/{issueId}/comments` takes `attachmentIds` (`CreateCommentRequest`): the caller's own uploads attached
 * to nothing, at most `ATTACHMENTS_PER_REQUEST_MAX`, attached in the comment's transaction. Errors: 400
 * `INVALID_ATTACHMENT` (not an upload of the caller's attached to nothing), 400 `FAILED_PRECONDITION`
 * `FILES_UNAVAILABLE` (the application stores no files), 413 `FILE_TOO_LARGE`.
 *
 * ## Content
 *
 * The content route always answers `X-Content-Type-Options: nosniff`, `Content-Security-Policy: sandbox` and
 * `Cache-Control: private, no-store`. Only raster images whose declared type and extension agree
 * (`isInlinePreviewable`) are served inline; everything else, SVG and HTML included, is a download.
 */

/** Per file, in bytes. */
export const ATTACHMENT_SIZE_MAX: number = 20 * 1024 * 1024;
/** Files sent with one comment, or attached in one request. */
export const ATTACHMENTS_PER_REQUEST_MAX = 10;
/** How long an upload attached to nothing is kept. */
export const ORPHAN_HOURS = 24;

/** The raster images shown inline, by extension: the declared type must be the one listed. */
export const INLINE_PREVIEW_TYPES: Readonly<Record<string, string>> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
};

/** A safe raster image, whose declared type matches its extension; anything else is only downloaded. */
export function isInlinePreviewable(mimeType: string, ext: string): boolean {
  const type = mimeType.split(';')[0]?.trim().toLowerCase() ?? '';
  return INLINE_PREVIEW_TYPES[ext.toLowerCase()] === type;
}

/** Who uploaded a file: a person, or a principal of another kind (an agent at work). */
export interface AttachmentUploader {
  /** A kind's key (`shared/kinds.ts`). */
  readonly type: string;
  readonly id: string;
  readonly name: string | null;
}

export interface Attachment {
  readonly id: string;
  readonly filename: string;
  /** Lower case, without the dot; empty when the name has none. */
  readonly ext: string;
  /** As the uploader declared it. */
  readonly mimeType: string;
  readonly size: number;
  readonly issueId: string | null;
  /** Set when it was sent with a comment. */
  readonly commentId: string | null;
  readonly uploader: AttachmentUploader;
  readonly createdAt: string;
  /** The content route, with the application's base path: shows a safe image inline, downloads anything else. */
  readonly contentUrl: string;
  /** The content route, always as a download. */
  readonly downloadUrl: string;
  /** A safe raster image the browser may show (`isInlinePreviewable`). */
  readonly previewable: boolean;
  /** The reader may remove it now (an issue's own file; a comment's files go with the comment). */
  readonly canDelete: boolean;
}
