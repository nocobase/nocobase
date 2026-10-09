import { ApiError, type ApiErrorStatus } from '@nocobase/app-server/router';
import {
  LifecycleError,
  lifecycleErrorFields,
  type LifecycleApiErrorOptions,
  type RecordView,
} from '@nocobase/lifecycle';

import { LIFECYCLE_ROUTES } from '../../shared/routes.js';
import { ExampleError } from '../services/lifecycle-example.js';

/** The namespace of every route this plugin owns, and the domain of its errors. */
export const LIFECYCLE_EXAMPLE_DOMAIN: string = LIFECYCLE_ROUTES;

/** Every route of this plugin is listed under one tag in the API document at `/api/swagger/docs`. */
export const tags: string[] = ['LifecycleExample'];

const EXAMPLE_STATUS: Record<ExampleError['code'], ApiErrorStatus> = {
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'PERMISSION_DENIED',
  LOCKED: 'FAILED_PRECONDITION',
  CONFLICT: 'ABORTED',
};

/**
 * The plugin's own refusals and the lifecycle's, as the standard error body.
 * `inputField` names where a transition's input sits in the request body, so
 * a field problem is reported where the caller sent it; `continuation` marks
 * a refusal `continueRun()` threw, which is the continuation's, not the
 * request's.
 */
export function toApiError(
  error: unknown,
  options: LifecycleApiErrorOptions = {},
): unknown {
  if (error instanceof LifecycleError) {
    const fields = lifecycleErrorFields(error, options);
    // A broken definition is the server's fault: the application answers 500.
    return fields
      ? new ApiError({ ...fields, domain: LIFECYCLE_EXAMPLE_DOMAIN })
      : error;
  }
  if (error instanceof ExampleError)
    return new ApiError({
      status: EXAMPLE_STATUS[error.code],
      reason: error.reason,
      domain: LIFECYCLE_EXAMPLE_DOMAIN,
      message: error.message,
    });
  return error;
}

/** A record with its id as a string, as every id in a response is. */
export function outward<R extends Readonly<Record<string, unknown>>>(
  record: R,
): R & { readonly id: string } {
  return { ...record, id: String(record.id) };
}

export function outwardView<V extends RecordView>(view: V): V {
  return { ...view, record: outward(view.record) };
}
