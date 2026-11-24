import type { BackupProblem } from './types.js';

export class BackupError extends Error {
  readonly code: string;
  readonly details?: Readonly<Record<string, unknown>>;

  constructor(
    code: string,
    message: string,
    details?: Readonly<Record<string, unknown>>,
  ) {
    super(message);
    this.name = 'BackupError';
    this.code = code;
    this.details = details;
  }
}

export function checkAbort(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new BackupError(
      'BACKUP_ABORTED',
      'The backup operation was interrupted.',
    );
  }
}

export function problem(
  error: unknown,
  code: string,
  message: string,
): BackupProblem {
  if (error instanceof BackupError) {
    return { code: error.code, message: error.message, details: error.details };
  }
  return { code, message };
}

export function asBackupError(
  error: unknown,
  code: string,
  message: string,
  signal?: AbortSignal,
): BackupError {
  if (error instanceof BackupError) return error;
  checkAbort(signal);
  const result = problem(error, code, message);
  return new BackupError(result.code, result.message, result.details);
}
