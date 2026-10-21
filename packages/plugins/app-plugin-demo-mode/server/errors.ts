import { ApiError } from '@nocobase/app-server/router';

import type { SqlWrite } from './sql.js';

export const DEMO_MODE_ERROR_DOMAIN = 'demoMode';
export const DEMO_READ_ONLY_REASON = 'DEMO_READ_ONLY';
export const DEMO_READ_ONLY_MESSAGE =
  'This is a demo. Changes cannot be saved.';

/**
 * Thrown from inside a query a demo request tried to run. It is an `ApiError` so a route that lets it through answers
 * the standard 400 body; a route that wraps it in its own error is corrected by the request middleware afterwards.
 * The 400 `FAILED_PRECONDITION` status, rather than 403, keeps clients from treating it as missing permission.
 */
export class DemoReadOnlyError extends ApiError {
  public readonly writes: readonly SqlWrite[];

  public constructor(writes: readonly SqlWrite[]) {
    super({
      status: 'FAILED_PRECONDITION',
      reason: DEMO_READ_ONLY_REASON,
      domain: DEMO_MODE_ERROR_DOMAIN,
      message: DEMO_READ_ONLY_MESSAGE,
    });
    this.name = 'DemoReadOnlyError';
    this.writes = writes;
  }
}
