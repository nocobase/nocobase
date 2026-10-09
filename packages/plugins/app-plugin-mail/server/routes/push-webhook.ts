import { createHash, timingSafeEqual } from 'node:crypto';

import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  defineRootRoutes,
  type AppRootRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';

import { type MailConfig } from '../config.js';
import {
  mailProviderRegistryToken,
  mailRuntimeToken,
  mailStoreToken,
} from '../tokens.js';
import type { MailAccount, MailProviderIdentity } from '../../shared/mail.js';
import type { MailProviderPushNotification } from '../contracts/provider.js';
import type { MailStore } from '../contracts/persistence.js';

const MAX_WEBHOOK_BYTES = 1_000_000;
const MAX_NOTIFICATIONS_PER_WEBHOOK = 100;

/** Public Provider callback protected by an unguessable URL secret and Provider client state. */
export const mailPushWebhookRoutes: AppRootRouteContribution<AppPluginApplication> =
  defineRootRoutes(({ container, config }) => {
    const router = new Hono();
    const registry = container.resolve(mailProviderRegistryToken);
    const store = container.resolve(mailStoreToken);
    const runtime = container.resolve(mailRuntimeToken);

    router.post(
      '/mail/webhooks/:providerType/:providerName/:secret',
      bodyLimit({
        maxSize: MAX_WEBHOOK_BYTES,
        onError: (context) => context.json({ accepted: false }, 413),
      }),
      async (context) => {
        const configured = config.get<MailConfig>('mail')!;
        const secret = context.req.param('secret');
        if (
          !configured.pushWebhookSecret ||
          !secretsEqual(secret, configured.pushWebhookSecret)
        ) {
          return context.json({ accepted: false }, 401);
        }
        const contentLength = Number(context.req.header('content-length') ?? 0);
        if (contentLength > MAX_WEBHOOK_BYTES) {
          return context.json({ accepted: false }, 413);
        }
        const provider: MailProviderIdentity = {
          type: context.req.param('providerType'),
          name: context.req.param('providerName'),
        };
        const providerConfig = configured.providers[provider.name];
        const definition = registry.definition(provider.type);
        if (
          !providerConfig ||
          providerConfig.type !== provider.type ||
          providerConfig.enabled === false ||
          !definition?.push
        ) {
          return context.json({ accepted: false }, 404);
        }
        const rawBody = await context.req.raw.arrayBuffer();
        if (rawBody.byteLength > MAX_WEBHOOK_BYTES) {
          return context.json({ accepted: false }, 413);
        }
        let body: unknown = {};
        if (
          rawBody.byteLength > 0 &&
          context.req.header('content-type')?.includes('application/json')
        ) {
          try {
            body = JSON.parse(new TextDecoder().decode(rawBody));
          } catch {
            return context.json({ accepted: false }, 400);
          }
        }
        const parsed = definition.push.parse({
          query: Object.fromEntries(new URL(context.req.url).searchParams),
          body,
        });
        if (!parsed.ok) return context.json({ accepted: false }, 400);
        if (parsed.value.challengeResponse !== undefined) {
          return context.text(parsed.value.challengeResponse, 200, {
            'content-type': 'text/plain',
          });
        }
        if (parsed.value.notifications.length > MAX_NOTIFICATIONS_PER_WEBHOOK) {
          return context.json({ accepted: false }, 413);
        }
        const accounts = await resolveAccounts(
          store,
          provider,
          parsed.value.notifications,
          configured.pushWebhookSecret,
        );
        if (!accounts) return context.json({ accepted: false }, 401);
        await runtime.schedulePushSyncBatch(accounts);
        return context.json({ accepted: true }, 202);
      },
    );

    return router;
  });

async function resolveAccounts(
  store: MailStore,
  provider: MailProviderIdentity,
  notifications: readonly MailProviderPushNotification[],
  secret: string,
): Promise<readonly MailAccount[] | undefined> {
  const unique = [
    ...new Map(
      notifications.map((notification) => [
        `${notification.providerSubscriptionId ?? ''}\0${notification.accountAddress ?? ''}`,
        notification,
      ]),
    ).values(),
  ];
  if (
    unique.some(
      (notification) =>
        notification.clientState !== undefined &&
        !secretsEqual(notification.clientState, secret),
    )
  ) {
    return undefined;
  }
  return store.findActiveAccountsForPush(
    provider,
    unique.flatMap(({ providerSubscriptionId }) =>
      providerSubscriptionId ? [providerSubscriptionId] : [],
    ),
    unique.flatMap(({ accountAddress }) =>
      accountAddress ? [accountAddress] : [],
    ),
  );
}

function secretsEqual(left: string, right: string): boolean {
  return timingSafeEqual(hash(left), hash(right));
}

function hash(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}
