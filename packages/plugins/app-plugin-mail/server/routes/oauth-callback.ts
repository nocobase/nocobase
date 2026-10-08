import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  defineRootRoutes,
  type AppRootRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';
import { getRequestTranslator } from '@nocobase/i18n/server';

import {
  type MailConfig,
  resolveMailOAuthCallbackPath,
  resolveMailOAuthReturnUrl,
} from '../config.js';
import { mailServiceToken } from '../tokens.js';

/** Public OAuth callback secured by a short-lived, one-time state transaction. */
export const mailOAuthCallbackRoutes: AppRootRouteContribution<AppPluginApplication> =
  defineRootRoutes(({ config, container, publicBasePath }) => {
    const router = new Hono();
    const mail = container.resolve(mailServiceToken);
    const mailConfig = config.get<MailConfig>('mail')!;
    const callbackPath = resolveMailOAuthCallbackPath(
      mailConfig.oauthCallbackUrl,
      publicBasePath,
    );

    router.get(callbackPath, async (context) => {
      const state = context.req.query('state');
      if (!state) {
        const t = getRequestTranslator(context, '@nocobase/app-plugin-mail');
        return context.json(
          {
            error: {
              code: 'MAIL_AUTHORIZATION_STATE_REQUIRED',
              ns: '@nocobase/app-plugin-mail',
              key: 'errors.authorizationStateRequired',
              params: {},
              message: t('errors.authorizationStateRequired'),
            },
          },
          400,
        );
      }
      try {
        await mail.completeAuthorization({
          state,
          code: context.req.query('code'),
          error: context.req.query('error'),
          errorDescription: context.req.query('error_description'),
        });
        return context.redirect(
          resolveMailOAuthReturnUrl(
            mailConfig.oauthReturnUrl,
            new URL(context.req.url).origin,
            publicBasePath,
            'success',
          ),
        );
      } catch {
        return context.redirect(
          resolveMailOAuthReturnUrl(
            mailConfig.oauthReturnUrl,
            new URL(context.req.url).origin,
            publicBasePath,
            'failure',
          ),
        );
      }
    });

    return router;
  });
