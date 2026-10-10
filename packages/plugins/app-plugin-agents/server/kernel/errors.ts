/**
 * Errors services throw. They are the protocol's errors (`@nocobase/agent-protocol`): each code is a reason of domain
 * `agents`, and the routers render it as the standard error body (`kernel/http.ts`).
 */
import { ProtocolError, type ErrorCode } from '@nocobase/agent-protocol';

export { ProtocolError };

export function invalid(
  message: string,
  details?: Readonly<Record<string, unknown>>,
): ProtocolError {
  return new ProtocolError('INVALID_REQUEST', message, details);
}

export type Missing =
  | 'Agent'
  | 'Run'
  | 'Run request'
  | 'Run context'
  | 'Brief'
  | 'Conversation'
  | 'Skill'
  | 'Skill version'
  | 'Skill file'
  | 'Mount'
  | 'Variable'
  | 'Runner'
  | 'Job'
  | 'Model service'
  | 'Scope'
  | 'Product'
  | 'File'
  | 'Attachment';

const MISSING: Readonly<Record<Missing, ErrorCode>> = {
  Agent: 'AGENT_NOT_FOUND',
  Run: 'RUN_NOT_FOUND',
  'Run request': 'RUN_REQUEST_NOT_FOUND',
  'Run context': 'RUN_CONTEXT_NOT_FOUND',
  Brief: 'BRIEF_NOT_FOUND',
  Conversation: 'CONVERSATION_NOT_FOUND',
  Skill: 'SKILL_NOT_FOUND',
  'Skill version': 'SKILL_VERSION_NOT_FOUND',
  'Skill file': 'SKILL_FILE_NOT_FOUND',
  Mount: 'MOUNT_NOT_FOUND',
  Variable: 'VARIABLE_NOT_FOUND',
  Runner: 'RUNNER_NOT_FOUND',
  Job: 'JOB_NOT_FOUND',
  'Model service': 'MODEL_SERVICE_NOT_FOUND',
  Scope: 'SCOPE_NOT_FOUND',
  Product: 'PRODUCT_NOT_FOUND',
  File: 'DIST_FILE_NOT_FOUND',
  Attachment: 'NOT_FOUND',
};

/** An object that does not exist, or that the caller may not see: the two are indistinguishable on purpose. */
export function notFound(what: Missing): ProtocolError {
  return new ProtocolError(MISSING[what], `${what} not found.`);
}

export function forbidden(message: string): ProtocolError {
  return new ProtocolError('FORBIDDEN', message);
}

/** The state of what the request names forbids it; `code` says which state. */
export function precondition(
  code: ErrorCode,
  message: string,
  details?: Readonly<Record<string, unknown>>,
): ProtocolError {
  return new ProtocolError(code, message, details);
}

/** A concurrent change won: read again and retry. */
export function conflict(
  message: string,
  details?: Readonly<Record<string, unknown>>,
): ProtocolError {
  return new ProtocolError('CONFLICT', message, details);
}
