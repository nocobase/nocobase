import {
  ApiError,
  apiErrorHandler,
  type ApiErrorStatus,
} from '@nocobase/app-server/router';
import {
  getRequestLocale,
  TRANSLATOR_CONTEXT_KEY,
  type Translator,
} from '@nocobase/i18n/server';
import type { Context, ErrorHandler } from 'hono';

import enUS from './locales/en-US.js';
import { IN_APP_NOTIFICATION_NAMESPACE } from './i18n.js';

/** The error domain of the inbox routes: the plugin's URL namespace. */
export const IN_APP_NOTIFICATION_ERROR_DOMAIN = 'notificationInApp';

type InAppErrorKey = keyof (typeof enUS)['errors'];

export interface InAppNotificationApiErrorOptions {
  readonly status: ApiErrorStatus;
  readonly reason: string;
  /** Key under `errors` in this plugin's server locale resources. */
  readonly key: InAppErrorKey;
  readonly field?: string;
}

/**
 * Builds an `ApiError` whose developer `message` is the English text of `key` and whose `localizedMessage` is the same
 * text translated into the request's locale, when the i18n middleware resolved one.
 */
export function inAppNotificationApiError(
  context: Context,
  options: InAppNotificationApiErrorOptions,
): ApiError {
  const message = enUS.errors[options.key];
  const locale = getRequestLocale(context);
  // Read rather than `getRequestTranslator()`, which throws without the i18n middleware: an error must still render.
  const translator = context.get(TRANSLATOR_CONTEXT_KEY) as
    Translator | undefined;
  const localizedMessage =
    locale && translator
      ? {
          locale,
          message: translator(`errors.${options.key}`, {
            ns: IN_APP_NOTIFICATION_NAMESPACE,
            defaultValue: message,
          }),
        }
      : undefined;
  return new ApiError({
    status: options.status,
    reason: options.reason,
    domain: IN_APP_NOTIFICATION_ERROR_DOMAIN,
    message,
    ...(localizedMessage ? { localizedMessage } : {}),
    ...(options.field
      ? {
          fieldViolations: [
            {
              field: options.field,
              description: localizedMessage?.message ?? message,
            },
          ],
        }
      : {}),
  });
}

/**
 * The inbox router's `onError`: the framework's handler renders what it recognizes, such as `ApiError`, in the standard
 * body, so the router answers the same way mounted on a bare Hono, and rethrows everything else to the application.
 */
export const inAppNotificationErrorHandler: ErrorHandler = apiErrorHandler;
