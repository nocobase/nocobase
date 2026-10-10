import { getRequestLocale, getRequestTranslator } from '@nocobase/i18n/server';
import {
  ApiError,
  apiErrorHandler,
  type ApiErrorOptions,
} from '@nocobase/app-server/router';
import type { Context, ErrorHandler } from 'hono';

import { WorkflowInvocationError } from '../engine/index.js';
import { WORKFLOW_ERROR_DOMAIN, workflowError } from '../errors.js';
import { WORKFLOW_NS } from '../../shared/namespace.js';

/** The server locale key holding the user-facing text of each reason this plugin reports. */
const localizedReasons: Readonly<Record<string, string>> = {
  WORKFLOW_MANAGEMENT_REQUIRED: 'errors.forbidden',
  WORKFLOW_SERVICE_NOT_CONFIGURED: 'errors.notConfigured',
  WORKFLOW_NOT_FOUND: 'errors.workflowNotFound',
  WORKFLOW_SOURCE_NOT_FOUND: 'errors.sourceNotFound',
  WORKFLOW_RUN_NOT_FOUND: 'errors.runNotFound',
  NODE_RUN_NOT_FOUND: 'errors.nodeRunNotFound',
  INVALID_WORKFLOW_ID: 'errors.invalidWorkflowId',
  INVALID_PARAMETER_VALUES: 'errors.invalidParameterValues',
  WORKFLOW_DISABLED: 'errors.workflowDisabled',
  INVALID_INPUT: 'errors.invalidInput',
  INPUT_TOO_LARGE: 'errors.inputTooLarge',
  PARENT_RUN_NOT_FOUND: 'errors.parentRunNotFound',
  STACK_LIMIT_EXCEEDED: 'errors.stackLimitExceeded',
};

const invocationStatuses: Readonly<
  Record<
    WorkflowInvocationError['code'],
    Pick<ApiErrorOptions, 'status' | 'httpStatus'>
  >
> = {
  WORKFLOW_NOT_FOUND: { status: 'NOT_FOUND' },
  WORKFLOW_DISABLED: { status: 'FAILED_PRECONDITION' },
  INVALID_INPUT: { status: 'INVALID_ARGUMENT' },
  INPUT_TOO_LARGE: { status: 'INVALID_ARGUMENT', httpStatus: 413 },
  PARENT_RUN_NOT_FOUND: { status: 'FAILED_PRECONDITION' },
  STACK_LIMIT_EXCEEDED: { status: 'FAILED_PRECONDITION' },
};

/** The standard error for a failed invocation, keeping the invocation code as its reason. */
export function invocationApiError(error: WorkflowInvocationError): ApiError {
  return workflowError({
    ...invocationStatuses[error.code],
    reason: error.code,
    message: error.message,
    ...(error.issues.length > 0
      ? {
          fieldViolations: error.issues.map((issue) => ({
            field: `input${issue.path.replace(/^\$/, '')}`,
            description: issue.message,
            reason: issue.keyword,
          })),
        }
      : {}),
    cause: error,
  });
}

/** Add the request's translation of a workflow reason, when the request carries a translator and the reason has text. */
export function localizeWorkflowError(
  context: Context,
  error: ApiError,
): ApiError {
  const key = localizedReasons[error.reason];
  if (error.domain !== WORKFLOW_ERROR_DOMAIN || !key || error.localizedMessage)
    return error;
  let translated: string;
  let locale: string | undefined;
  try {
    translated = getRequestTranslator(context, WORKFLOW_NS)(key, {
      defaultValue: error.message,
    });
    locale = getRequestLocale(context);
  } catch {
    // Without the i18n middleware there is no request language to translate into.
    return error;
  }
  if (!locale) return error;
  return new ApiError({
    status: error.status,
    reason: error.reason,
    domain: error.domain,
    message: error.message,
    localizedMessage: { locale, message: translated },
    ...(error.fieldViolations
      ? { fieldViolations: error.fieldViolations }
      : {}),
    ...(error.metadata ? { metadata: error.metadata } : {}),
    httpStatus: error.code,
    cause: error.cause,
  });
}

/** Answer with the standard error body for a workflow error. */
export function workflowErrorResponse(
  context: Context,
  error: ApiError,
): Response {
  return apiErrorHandler(localizeWorkflowError(context, error), context);
}

/**
 * Translates and localizes the errors workflow routes raise, so each router answers the standard body even when it is
 * mounted on its own. Everything else goes to the framework's handler, which renders what it recognizes and rethrows the
 * rest for the application to answer.
 */
export const workflowErrorHandler: ErrorHandler = (error, context) => {
  const translated =
    error instanceof WorkflowInvocationError
      ? invocationApiError(error)
      : error;
  return apiErrorHandler(
    translated instanceof ApiError
      ? localizeWorkflowError(context, translated)
      : translated,
    context,
  );
};
