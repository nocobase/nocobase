/**
 * A refusal of the knowledge base: an HTTP status, a stable code (the API's `reason`) and, for an invalid input, the
 * field it names. The routes translate it into the standard error body (`routes/errors.ts`).
 */
export type KnowledgeErrorStatus = 400 | 401 | 403 | 404 | 409 | 413;

export class KnowledgeError extends Error {
  public readonly status: KnowledgeErrorStatus;
  public readonly code: string;
  public readonly details?: Readonly<Record<string, unknown>>;
  /** The input field at fault, for a 400. */
  public readonly field?: string;

  public constructor(
    status: KnowledgeErrorStatus,
    code: string,
    message: string,
    details?: Readonly<Record<string, unknown>>,
    field?: string,
  ) {
    super(message);
    this.name = 'KnowledgeError';
    this.status = status;
    this.code = code;
    if (details) this.details = details;
    if (field) this.field = field;
  }
}

export const invalid = (
  code: string,
  message: string,
  field?: string,
): KnowledgeError => new KnowledgeError(400, code, message, undefined, field);

export const forbidden = (
  message: string,
  code: string = 'FORBIDDEN',
): KnowledgeError => new KnowledgeError(403, code, message);

/** `code` is specific to what is missing, such as `DOC_NOT_FOUND`. */
export const notFound = (what: string, code: string): KnowledgeError =>
  new KnowledgeError(404, code, `${what} not found.`);

export const docNotFound = (): KnowledgeError =>
  notFound('Knowledge document', 'DOC_NOT_FOUND');

/** A document the request body names, by `field`, that is missing or hidden from the reader. */
export const docArgumentNotFound = (field: string = 'docId'): KnowledgeError =>
  invalid('DOC_NOT_FOUND', 'Knowledge document not found.', field);

export const conflict = (
  code: string,
  message: string,
  details?: Readonly<Record<string, unknown>>,
): KnowledgeError => new KnowledgeError(409, code, message, details);
