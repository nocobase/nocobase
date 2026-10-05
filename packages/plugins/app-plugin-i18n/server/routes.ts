import { getContextSession, LOCALE_SESSION_KEY } from '@nocobase/i18n/server';
import { i18nToken } from '@nocobase/app-server/i18n';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  apiErrorHandler,
  apiErrorResponse,
  apiValidator,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';
import { BASE_LOCALE } from '@nocobase/i18n';

import type { ServerLocaleList, ServerLocaleResult } from '../locale-result.js';
import { ServerLocaleListSchema, SetSessionLocaleInput } from './schemas.js';

/**
 * The language endpoints: what is available, and which one this session wants.
 *
 * The browser keeps its own copy in storage and is the source of truth for what it renders; this only tells the server
 * which language to answer in, so an error message or a mail body comes back in the language the visitor is reading.
 */
export const i18nApiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes(({ container }) => {
    const router = new Hono();
    const runtime = container.resolve(i18nToken);
    // Validation errors answer in the standard body even when the router is mounted on its own.
    router.onError(apiErrorHandler);

    router.get(
      '/i18n/locales',
      describeRoute({
        tags: ['I18n'],
        summary: 'List the languages the server answers in',
        operationId: 'i18nListLocales',
        // The sign-in page reads it before anyone is signed in.
        security: [],
        description:
          'The server’s default language and every language it offers. Needs no session or API key.',
        responses: {
          200: dataResponse(ServerLocaleListSchema),
          500: apiErrorResponse(500),
        },
      }),
      (context) =>
        context.json({
          data: {
            defaultLocale: runtime.getDefaultLocale(),
            locales: runtime.getLocaleDefinitions(),
          } satisfies ServerLocaleList,
        }),
    );

    // The session's language is a singleton setting, so it is replaced with PUT rather than created with POST.
    router.put(
      '/i18n/locale',
      // Hidden: it stores a preference on the browser's cookie session for the application shell; a caller with an API
      // key has no session, so the call changes nothing it could rely on.
      describeRoute({ hide: true }),
      apiValidator('json', SetSessionLocaleInput),
      async (context) => {
        const { locale: requested } = context.req.valid('json');

        // Client and server locale lists are independent. A client-only language must not prevent a browser switch, so
        // an unsupported language is a successful fallback to English rather than an error.
        const supported = runtime
          .getLocales()
          .find((locale) => locale === requested);
        const locale = supported ?? BASE_LOCALE;

        const session = getContextSession(context);
        if (session) await session.set(LOCALE_SESSION_KEY, locale);

        return context.json({
          data: {
            locale,
            requestedLocale: requested,
            fallback: supported === undefined,
          } satisfies ServerLocaleResult,
        });
      },
    );

    return router;
  });

const routes: readonly AppApiRouteContribution<AppPluginApplication>[] = [
  i18nApiRoutes,
];

export default routes;
