import { AsyncLocalStorage } from 'node:async_hooks';
import type { Context } from 'hono';
import type { DatabaseConnection } from '@nocobase/db';
import {
  ApiError,
  executeIdempotentMutation,
  type RepositoryIdempotencyConfig,
} from '@nocobase/app-server/router';

interface SettingsSubmissionContext {
  context: Context;
  connection: DatabaseConnection;
  protection?: RepositoryIdempotencyConfig;
  replayed?: boolean;
}
// Only request-scoped dependencies live here; operation state lives in the database receipt.
const requestScope = new AsyncLocalStorage<SettingsSubmissionContext>();
export function withSettingsSubmission(
  scope: SettingsSubmissionContext,
  execute: () => Response | undefined | Promise<Response | undefined>,
): Promise<Response | undefined> {
  return requestScope.run(scope, async () => {
    const response = await execute();
    if (response && scope.replayed !== undefined)
      response.headers.set('Idempotency-Replayed', String(scope.replayed));
    return response;
  });
}

/** Called after the route's native write guard; bound APIs keep writes inside the receipt transaction. */
export async function submitSettingsMutation<T>(
  input: unknown,
  execute: (transaction?: DatabaseConnection) => Promise<T>,
  authorizeReplay: () => Promise<void>,
): Promise<T> {
  const scope = requestScope.getStore();
  const key = scope?.context.req.header('Idempotency-Key');
  if (!scope?.protection || (!scope.protection.required && !key)) {
    if (key)
      throw new ApiError({
        status: 'FAILED_PRECONDITION',
        reason: 'IDEMPOTENCY_UNAVAILABLE',
        domain: 'authorization',
        message: 'Operation receipts are unavailable.',
      });
    return execute();
  }
  if (!key)
    throw new ApiError({
      status: 'INVALID_ARGUMENT',
      reason: 'OPERATION_KEY_REQUIRED',
      domain: 'authorization',
      message: 'Standard writes require an Idempotency-Key header.',
    });
  const principal = await scope.protection.principal(scope.context);
  if (!principal)
    throw new ApiError({
      status: 'PERMISSION_DENIED',
      reason: 'PRINCIPAL_REQUIRED',
      domain: 'authorization',
      message: 'An authenticated principal is required.',
    });
  const result = await executeIdempotentMutation({
    connection: scope.connection,
    key,
    principal,
    operation: `${scope.context.req.method} ${new URL(scope.context.req.url).pathname}`,
    input,
    authorize: () => undefined,
    authorizeReplay,
    execute: (transaction) => execute(transaction),
  });
  scope.replayed = result.replayed;
  return result.data;
}
