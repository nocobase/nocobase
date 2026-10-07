/**
 * Maps how a Claude Code run ended (SDK result, assistant error code, thrown
 * error) to a protocol FailureReason, so the server can decide whether to
 * retry.
 */
import type { FailureReason } from './types.ts';

export interface ClaudeFailureSignal {
  /** The run was stopped by the runner or the abort signal. */
  aborted?: boolean;
  /** An error thrown by the SDK or the process. */
  error?: unknown;
  /** `subtype` of the final result message, when it is not 'success'. */
  resultSubtype?: string;
  /** `errors` of an error result, or the result text of a failed success. */
  resultErrors?: readonly string[];
  /** `terminal_reason` of the final result message. */
  terminalReason?: string;
  /** `startup_failure_reason` of a startup error result. */
  startupFailureReason?: string;
  /** `api_error_status` of the final result message. */
  apiErrorStatus?: number | null;
  /** The last `error` code seen on an assistant or api_retry message. */
  assistantError?: string;
}

export interface ClassifiedFailure {
  reason: FailureReason;
  message: string;
}

const ASSISTANT_ERRORS: Readonly<Record<string, FailureReason>> = {
  authentication_failed: 'toolAuth',
  oauth_org_not_allowed: 'toolAuth',
  account_on_hold: 'toolAuth',
  verification_required: 'toolAuth',
  cloud_credential_error: 'toolAuth',
  billing_error: 'toolQuota',
  rate_limit: 'toolRateLimit',
  overloaded: 'toolNetwork',
  server_error: 'toolNetwork',
  model_not_found: 'modelUnavailable',
  invalid_request: 'unknown',
  max_output_tokens: 'unknown',
  unknown: 'unknown',
};

const STARTUP_FAILURES: Readonly<Record<string, FailureReason>> = {
  gateway_signin_required: 'toolAuth',
  gateway_access_denied: 'toolAuth',
  org_verify_failed: 'toolAuth',
  org_pin_mismatch: 'toolAuth',
  org_pin_api_key_conflict: 'toolAuth',
  provider_not_allowed: 'toolAuth',
  proxy_invalid: 'toolNetwork',
  remote_settings_required_unavailable: 'toolNetwork',
  cwd_unavailable: 'setupFailed',
  worktree_unverified: 'setupFailed',
  worktree_resume_refused: 'setupFailed',
};

const CONTEXT_TERMINAL_REASONS = new Set(['prompt_too_long', 'blocking_limit']);

/**
 * The run's model (`RunPayload.tool.model`) is unknown to the tool or not available to the account it is signed in
 * with. Checked before the other rules: providers word it as a 404 or a permission error.
 */
export const MODEL_UNAVAILABLE_RULE: readonly [RegExp, FailureReason] = [
  /model_not_found|unknown model|invalid model|issue with the selected model|\bmodel\b[^.\n]{0,120}?\b(?:not found|does not exist|may not exist|is not available|not supported|is not supported|unavailable|not accessible|do(?:es)? not have access|not have access)/i,
  'modelUnavailable',
];

const TEXT_RULES: readonly (readonly [RegExp, FailureReason])[] = [
  MODEL_UNAVAILABLE_RULE,
  [
    /prompt is too long|context (window|length)|too many tokens/i,
    'contextOverflow',
  ],
  [
    /not logged in|please run \/login|invalid api key|authentication|unauthori[sz]ed|oauth token|\bstatus(?: code)? 40[13]\b/i,
    'toolAuth',
  ],
  [/credit balance|billing|usage limit|quota|out of credits/i, 'toolQuota'],
  [/rate.?limit|\bstatus(?: code)? 429\b|too many requests/i, 'toolRateLimit'],
  [
    /ECONNRESET|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|socket hang up|fetch failed|network error|overloaded|\bstatus(?: code)? 5\d\d\b|internal server error|bad gateway|service unavailable/i,
    'toolNetwork',
  ],
  [
    /executable|native cli binary|failed to launch|ENOENT|EACCES|process exited|exited with code|killed by signal|spawn/i,
    'toolProcess',
  ],
];

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error === undefined || error === null) return '';
  try {
    return JSON.stringify(error);
  } catch {
    return Object.prototype.toString.call(error);
  }
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'AbortError' || error.constructor.name === 'AbortError')
  );
}

export function classifyClaudeFailure(
  signal: ClaudeFailureSignal,
): ClassifiedFailure {
  const parts = [
    messageOf(signal.error),
    ...(signal.resultErrors ?? []),
    signal.resultSubtype && signal.resultSubtype !== 'success'
      ? signal.resultSubtype
      : '',
  ].filter(Boolean);
  const message =
    parts.join('; ') ||
    signal.assistantError ||
    signal.terminalReason ||
    'Claude Code run failed';

  if (signal.aborted || isAbortError(signal.error))
    return { reason: 'cancelled', message: message || 'aborted' };

  if (signal.startupFailureReason) {
    if (signal.startupFailureReason in STARTUP_FAILURES) {
      return { reason: STARTUP_FAILURES[signal.startupFailureReason], message };
    }
    return { reason: 'toolProcess', message };
  }

  if (
    signal.terminalReason &&
    CONTEXT_TERMINAL_REASONS.has(signal.terminalReason)
  ) {
    return { reason: 'contextOverflow', message };
  }

  if (signal.assistantError && signal.assistantError in ASSISTANT_ERRORS) {
    const reason = ASSISTANT_ERRORS[signal.assistantError];
    if (reason !== 'unknown') return { reason, message };
  }

  // A model the account cannot use is often answered 403 or 404: name it before the status does.
  if (MODEL_UNAVAILABLE_RULE[0].test(message))
    return { reason: 'modelUnavailable', message };

  const status = signal.apiErrorStatus;
  if (typeof status === 'number') {
    if (status === 401 || status === 403)
      return { reason: 'toolAuth', message };
    if (status === 429) return { reason: 'toolRateLimit', message };
    if (status === 413) return { reason: 'contextOverflow', message };
    if (status >= 500) return { reason: 'toolNetwork', message };
  }

  if (signal.resultSubtype === 'error_max_budget_usd')
    return { reason: 'toolQuota', message };

  for (const [pattern, reason] of TEXT_RULES) {
    if (pattern.test(message)) return { reason, message };
  }
  return { reason: 'unknown', message };
}
