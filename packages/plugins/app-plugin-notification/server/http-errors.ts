import {
  ApiError,
  apiErrorHandler,
  apiErrorStatusFromHttp,
  type ApiErrorStatus,
  type ApiFieldViolation,
} from '@nocobase/app-server/router';
import {
  getRequestLocale,
  isAppI18nError,
  TRANSLATOR_CONTEXT_KEY,
  type AppI18nError,
  type Translator,
} from '@nocobase/i18n/server';
import type { Context, ErrorHandler } from 'hono';

import enUS from './locales/en-US.js';
import { NOTIFICATION_NAMESPACE } from './types.js';

/** The error domain of every notification route: the plugin's URL namespace. */
export const NOTIFICATION_ERROR_DOMAIN = 'notifications';

export interface NotificationApiErrorOptions {
  readonly status: ApiErrorStatus;
  readonly reason: string;
  /** Key in this plugin's server locale resources, such as `errors.logNotFound`. */
  readonly key: string;
  readonly params?: Readonly<Record<string, unknown>>;
  readonly fieldViolations?: readonly ApiFieldViolation[];
  readonly cause?: unknown;
}

/**
 * Builds an `ApiError` whose developer `message` is the English text of `key` and whose `localizedMessage` is the same
 * text translated into the request's locale, when the i18n middleware resolved one.
 */
export function notificationApiError(
  context: Context,
  options: NotificationApiErrorOptions,
): ApiError {
  const message = englishMessage(options.key, options.params);
  const localizedMessage = localize(context, options.key, options.params);
  return new ApiError({
    status: options.status,
    reason: options.reason,
    domain: NOTIFICATION_ERROR_DOMAIN,
    message,
    ...(localizedMessage ? { localizedMessage } : {}),
    ...(options.fieldViolations?.length
      ? {
          fieldViolations: options.fieldViolations.map((violation) => ({
            ...violation,
            description: localizedMessage?.message ?? message,
          })),
        }
      : {}),
    ...(options.params ? { metadata: options.params } : {}),
    ...(options.cause === undefined ? {} : { cause: options.cause }),
  });
}

/**
 * Translates an `AppI18nError` raised by the notification runtime into the standard error. The runtime throws these
 * because it does not know the request's locale; the route does.
 */
export function notificationApiErrorFromI18n(
  context: Context,
  error: AppI18nError,
): ApiError {
  const field = violatedField(error);
  return notificationApiError(context, {
    status: apiErrorStatusFromHttp(error.status),
    reason: error.code,
    key: error.key,
    ...(error.params ? { params: error.params } : {}),
    ...(field ? { fieldViolations: [{ field, description: '' }] } : {}),
    cause: error,
  });
}

/**
 * The `onError` of every notification router. It translates the runtime's localized errors and leaves everything else to
 * the framework's handler, which renders what it recognizes, such as `ApiError`, in the standard body, so a router
 * answers the same way mounted on a bare Hono, and rethrows the rest to the application.
 */
export const notificationErrorHandler: ErrorHandler = (error, context) =>
  apiErrorHandler(
    isNotificationI18nError(error)
      ? notificationApiErrorFromI18n(context, error)
      : error,
    context,
  );

/** Whether `error` is a notification runtime error this plugin's routes translate. */
export function isNotificationI18nError(error: unknown): error is AppI18nError {
  return isAppI18nError(error) && error.ns === NOTIFICATION_NAMESPACE;
}

function violatedField(error: AppI18nError): string | undefined {
  if (error.code === 'NOTIFICATION_TEST_TARGET_UNAVAILABLE') return 'channel';
  const name = error.params?.name;
  return typeof name === 'string' &&
    [
      'NOTIFICATION_TEST_UNKNOWN_FIELD',
      'NOTIFICATION_TEST_REQUIRED_FIELD',
      'NOTIFICATION_TEST_FIELD_TOO_LONG',
    ].includes(error.code)
    ? `values.${name}`
    : undefined;
}

function localize(
  context: Context,
  key: string,
  params: Readonly<Record<string, unknown>> | undefined,
): { readonly locale: string; readonly message: string } | undefined {
  const locale = getRequestLocale(context);
  // Read rather than `getRequestTranslator()`, which throws without the i18n middleware: an error must still render.
  const translator = context.get(TRANSLATOR_CONTEXT_KEY) as
    Translator | undefined;
  if (!locale || !translator) return undefined;
  return {
    locale,
    message: translator(key, {
      ...params,
      ns: NOTIFICATION_NAMESPACE,
      defaultValue: englishMessage(key, params),
    }),
  };
}

function englishMessage(
  key: string,
  params: Readonly<Record<string, unknown>> | undefined,
): string {
  const template = key
    .split('.')
    .reduce<unknown>(
      (value, segment) =>
        typeof value === 'object' && value !== null
          ? (value as Record<string, unknown>)[segment]
          : undefined,
      enUS,
    );
  if (typeof template !== 'string') return key;
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name: string) => {
    const value = params?.[name];
    if (value === undefined) return match;
    return typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
      ? String(value)
      : JSON.stringify(value);
  });
}
