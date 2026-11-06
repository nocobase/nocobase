import {
  getRequestLocale,
  TRANSLATOR_CONTEXT_KEY,
  type Translator,
} from '@nocobase/i18n/server';
import type { Context } from 'hono';
import { getRequestId } from '@nocobase/app-server/router';

import {
  DEMO_MODE_ERROR_DOMAIN,
  DEMO_READ_ONLY_MESSAGE,
  DEMO_READ_ONLY_REASON,
} from './errors.js';
import { DEMO_MODE_NAMESPACE } from './namespace.js';

/** Browsers expose this response metric through resource timing so the client can report refusals. */
export const DEMO_SERVER_TIMING_METRIC = 'demo-read-only';

export function respondDemoReadOnly(context: Context): void {
  const translator = context.get(TRANSLATOR_CONTEXT_KEY) as
    Translator | undefined;
  const locale = getRequestLocale(context);
  const requestId = getRequestId(context);
  const body = {
    error: {
      code: 400,
      status: 'FAILED_PRECONDITION',
      reason: DEMO_READ_ONLY_REASON,
      domain: DEMO_MODE_ERROR_DOMAIN,
      message: DEMO_READ_ONLY_MESSAGE,
      ...(translator && locale
        ? {
            localizedMessage: {
              locale,
              message: translator('errors.readOnly', {
                ns: DEMO_MODE_NAMESPACE,
                defaultValue: DEMO_READ_ONLY_MESSAGE,
              }),
            },
          }
        : {}),
      requestId,
    },
  };
  const headers = new Headers(context.res.headers);
  headers.delete('content-length');
  headers.delete('content-encoding');
  headers.set('content-type', 'application/json; charset=UTF-8');
  headers.set('x-request-id', requestId);
  headers.append('Server-Timing', DEMO_SERVER_TIMING_METRIC);
  // Cleared first so Hono does not merge the failed response's headers, such as its length, into the new one.
  context.res = undefined;
  context.res = new Response(JSON.stringify(body), { status: 400, headers });
}
