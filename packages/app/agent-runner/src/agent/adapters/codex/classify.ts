/**
 * Maps how a Codex run ended (a turn error's `codexErrorInfo`, an RPC
 * error, the process exit) to a protocol FailureReason.
 */
import { classifyClaudeFailure } from '../classify.ts';
import type { FailureReason } from '../types.ts';
import type { CodexErrorInfo } from './protocol.ts';

export interface CodexFailureSignal {
  aborted?: boolean;
  /** The failed turn's `codexErrorInfo`, or the last non-retried error's. */
  codexErrorInfo?: CodexErrorInfo | null;
  /** Error message (turn error, RPC error or process failure). */
  message?: string;
  /** The app-server exited or could not be started. */
  processFailed?: boolean;
}

export interface ClassifiedFailure {
  reason: FailureReason;
  message: string;
}

const ERROR_INFO: Readonly<Record<string, FailureReason>> = {
  contextWindowExceeded: 'contextOverflow',
  sessionBudgetExceeded: 'toolQuota',
  usageLimitExceeded: 'toolQuota',
  rateLimitExceeded: 'toolRateLimit',
  serverOverloaded: 'toolNetwork',
  flexUnavailable: 'toolNetwork',
  internalServerError: 'toolNetwork',
  httpConnectionFailed: 'toolNetwork',
  responseStreamConnectionFailed: 'toolNetwork',
  responseStreamDisconnected: 'toolNetwork',
  responseTooManyFailedAttempts: 'toolNetwork',
  unauthorized: 'toolAuth',
  sandboxError: 'toolProcess',
};

function infoKey(info: CodexErrorInfo | null | undefined): string | undefined {
  if (!info) return undefined;
  if (typeof info === 'string') return info;
  return Object.keys(info)[0];
}

function httpStatus(info: CodexErrorInfo | null | undefined): number | null {
  if (!info || typeof info === 'string') return null;
  const value = Object.values(info)[0];
  return value?.httpStatusCode ?? null;
}

export function classifyCodexFailure(
  signal: CodexFailureSignal,
): ClassifiedFailure {
  const message = signal.message || 'Codex run failed';
  if (signal.aborted) return { reason: 'cancelled', message };

  const status = httpStatus(signal.codexErrorInfo);
  if (status === 401 || status === 403) return { reason: 'toolAuth', message };
  if (status === 429) return { reason: 'toolRateLimit', message };

  const key = infoKey(signal.codexErrorInfo);
  if (key && key in ERROR_INFO) return { reason: ERROR_INFO[key], message };

  // Fall back to the shared text rules (auth, quota, network, process).
  const byText = classifyClaudeFailure({ error: new Error(message) });
  if (byText.reason !== 'unknown') return { reason: byText.reason, message };
  if (signal.processFailed) return { reason: 'toolProcess', message };
  return { reason: 'unknown', message };
}
