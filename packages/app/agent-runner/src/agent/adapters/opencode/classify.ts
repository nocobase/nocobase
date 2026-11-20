/**
 * Maps how an OpenCode run ended to a protocol FailureReason.
 *
 * OpenCode 2.x reports failures as a structured error `{ type, message,
 * status? }` on `session.execution.failed` and `session.step.failed`. The
 * provider types come from its provider error taxonomy (`provider.auth`,
 * `provider.rate-limit`, `provider.quota`, `provider.transport`, ...).
 */
import { MODEL_UNAVAILABLE_RULE } from '../classify.ts';
import type { FailureReason } from '../types.ts';
import { messageOf } from './util.ts';

export interface OpencodeFailureSignal {
  /** The run was stopped by the runner or the abort signal. */
  aborted?: boolean;
  /** `error.type` of the structured error. */
  errorType?: string;
  /** `error.status` (HTTP status of the provider), when known. */
  status?: number;
  /** The structured error message, or any thrown error. */
  error?: unknown;
  /** Extra text that helps (server stderr tail). */
  details?: readonly string[];
}

export interface ClassifiedFailure {
  reason: FailureReason;
  message: string;
  /** The stderr tail, for the runner's log. */
  log?: string;
}

const ERROR_TYPES: Readonly<Record<string, FailureReason>> = {
  'provider.auth': 'toolAuth',
  'provider.quota': 'toolQuota',
  'provider.rate-limit': 'toolRateLimit',
  'provider.transport': 'toolNetwork',
  'provider.internal': 'toolNetwork',
  aborted: 'cancelled',
};

const TEXT_RULES: readonly (readonly [RegExp, FailureReason])[] = [
  MODEL_UNAVAILABLE_RULE,
  [
    /context (window|length|overflow)|prompt is too long|too many tokens|maximum context|ContextOverflow/i,
    'contextOverflow',
  ],
  [
    /invalid api key|api key|authentication|unauthori[sz]ed|not logged in|\bstatus(?: code)? 40[13]\b/i,
    'toolAuth',
  ],
  [
    /insufficient_quota|billing|quota|credit balance|out of credits/i,
    'toolQuota',
  ],
  [/rate.?limit|\bstatus(?: code)? 429\b|too many requests/i, 'toolRateLimit'],
  [
    /ECONNRESET|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|socket hang up|fetch failed|network error|overloaded|\bstatus(?: code)? 5\d\d\b|internal server error|bad gateway|service unavailable/i,
    'toolNetwork',
  ],
  [
    /ENOENT|EACCES|spawn|exited with code|killed by signal|server (exited|stopped)|event stream/i,
    'toolProcess',
  ],
];

function classify(signal: OpencodeFailureSignal): ClassifiedFailure {
  // What is reported is the tool's own message; the stderr tail only helps classify it and stays in the runner's log.
  const message =
    messageOf(signal.error) || signal.errorType || 'OpenCode run failed';
  const text = [message, ...(signal.details ?? [])].filter(Boolean).join('; ');

  if (signal.aborted) return { reason: 'cancelled', message };

  if (signal.errorType && signal.errorType in ERROR_TYPES)
    return { reason: ERROR_TYPES[signal.errorType], message };

  // A model the account cannot use is often answered 403 or 404: name it before the status does.
  if (MODEL_UNAVAILABLE_RULE[0].test(text))
    return { reason: 'modelUnavailable', message };

  const status = signal.status;
  if (typeof status === 'number') {
    if (status === 401 || status === 403)
      return { reason: 'toolAuth', message };
    if (status === 429) return { reason: 'toolRateLimit', message };
    if (status === 413) return { reason: 'contextOverflow', message };
    if (status >= 500) return { reason: 'toolNetwork', message };
  }

  for (const [pattern, reason] of TEXT_RULES) {
    if (pattern.test(text)) return { reason, message };
  }
  return { reason: 'unknown', message };
}

export function classifyOpencodeFailure(
  signal: OpencodeFailureSignal,
): ClassifiedFailure {
  const failure = classify(signal);
  const log = (signal.details ?? []).filter(Boolean).join('\n');
  return log ? { ...failure, log } : failure;
}
