import type { Logger } from '@nocobase/logging';
import type { WorkflowLogger } from './types.js';

/** Adapt the workflow message-first API at the application boundary. */
export function createWorkflowLogger(logger: Logger): WorkflowLogger {
  return {
    debug: (message, details) => logger.debug(fields(details), message),
    info: (message, details) => logger.info(fields(details), message),
    warn: (message, details) => logger.warn(fields(details), message),
    error: (message, details) => logger.error(fields(details), message),
  };
}
function fields(details: unknown): Record<string, unknown> {
  if (details instanceof Error) return { err: details };
  if (details && typeof details === 'object' && !Array.isArray(details)) {
    const { error, ...rest } = details as Record<string, unknown>;
    return { ...rest, ...(error === undefined ? {} : { err: error }) };
  }
  return details === undefined ? {} : { details };
}
export function bindWorkflowLogger(
  logger: WorkflowLogger,
  bindings: Record<string, unknown>,
): WorkflowLogger {
  return {
    debug: (message, details) =>
      logger.debug(message, { ...fields(details), ...bindings }),
    info: (message, details) =>
      logger.info(message, { ...fields(details), ...bindings }),
    warn: (message, details) =>
      logger.warn(message, { ...fields(details), ...bindings }),
    error: (message, details) =>
      logger.error(message, { ...fields(details), ...bindings }),
  };
}
