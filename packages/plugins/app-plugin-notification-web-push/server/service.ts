import { randomUUID } from 'node:crypto';
import type {
  NotificationService,
  ProviderSendResult,
} from '@nocobase/app-plugin-notification/server';
import { z } from 'zod';
import {
  PushError,
  type Subscriptions,
  type SubscriptionRow,
  type SubscriptionInputValue,
  type Device,
} from './subscriptions.js';

export interface WebPushMessage {
  to: { id: string; userId: string }[];
  title: string;
  body?: string;
  url: string;
  dedupeKey: string;
  beforeSend?: { name: string; context?: unknown };
}
export const PushMessage: z.ZodType<WebPushMessage> = z.object({
  to: z.array(z.object({ id: z.string(), userId: z.string() })).min(1),
  title: z.string().max(200),
  body: z.string().max(2000).optional(),
  url: z.string().max(4096),
  dedupeKey: z.string().max(512),
  beforeSend: z.object({ name: z.string(), context: z.unknown() }).optional(),
});
export interface PreparedPush {
  device: { id: string; userId: string };
  message: Omit<WebPushMessage, 'to'>;
}
/** Runs on every attempt, after resolving the current enabled device. Missing hooks fail closed. */
export type BeforePush = (
  input: PreparedPush,
  device: SubscriptionRow,
  signal: AbortSignal,
) => Promise<false | Partial<Omit<WebPushMessage, 'to' | 'beforeSend'>>>;
/** Runs after an authenticated device subscription has been saved. */
export type AfterSubscribe = (userId: string, device: Device) => Promise<void>;
export interface WebPushDependencies {
  subscriptions: Subscriptions;
  notifications: () => NotificationService;
  transport: (
    subscription: ReturnType<Subscriptions['open']>,
    payload: object,
    signal: AbortSignal,
  ) => Promise<number>;
  base: string;
  channel?: string;
}
/** Constrain even malformed/absolute click URLs to the application's path; the worker rechecks origin. */
export function pushTarget(value: string, base: string): string {
  const scope = `${base.replace(/\/+$/u, '')}/`;
  const origin = 'https://web-push.invalid';
  const url = new URL(value, origin + scope);
  if (url.origin !== origin || !url.pathname.startsWith(scope))
    throw new PushError('endpoint');
  return url.pathname + url.search + url.hash;
}
export interface WebPushService {
  readonly subscriptions: Subscriptions;
  beforeSend(name: string, hook: BeforePush): () => void;
  afterSubscribe(name: string, hook: AfterSubscribe): () => void;
  subscribe(userId: string, input: SubscriptionInputValue): Promise<Device>;
  test(userId: string, id: string): Promise<void>;
  deliver(
    input: PreparedPush,
    signal: AbortSignal,
  ): Promise<ProviderSendResult>;
}
export function createWebPushService(
  deps: WebPushDependencies,
): WebPushService {
  const hooks = new Map<string, BeforePush>();
  const subscribed = new Map<string, AfterSubscribe>();
  const testing = new Map<string, number>();
  return {
    subscriptions: deps.subscriptions,
    afterSubscribe(name: string, hook: AfterSubscribe): () => void {
      if (subscribed.has(name))
        throw new Error('Duplicate Web Push subscription hook.');
      subscribed.set(name, hook);
      return () => {
        subscribed.delete(name);
      };
    },
    async subscribe(
      userId: string,
      input: SubscriptionInputValue,
    ): Promise<Device> {
      const device = await deps.subscriptions.save(userId, input);
      for (const hook of subscribed.values()) await hook(userId, device);
      return device;
    },
    beforeSend(name: string, hook: BeforePush): () => void {
      if (hooks.has(name)) throw new Error('Duplicate Web Push hook.');
      hooks.set(name, hook);
      return () => {
        hooks.delete(name);
      };
    },
    async test(userId: string, id: string): Promise<void> {
      const row = await deps.subscriptions.get(userId, id);
      if (!row) throw new PushError('missing');
      if (!row.enabled) throw new PushError('unavailable');
      const now = Date.now();
      if (now - (testing.get(userId) ?? 0) < 30_000)
        throw new PushError('limited');
      testing.set(userId, now);
      if (testing.size > 2048) testing.delete(testing.keys().next().value!);
      const dedupeKey = `test:${randomUUID()}`;
      await deps.notifications().send({
        idempotencyKey: dedupeKey,
        messages: {
          [deps.channel ?? 'webPush']: {
            to: [{ id, userId }],
            title: row.locale === 'zh-CN' ? '测试通知' : 'Test notification',
            body: '',
            url: `${deps.base.replace(/\/$/u, '')}/`,
            dedupeKey,
          },
        },
      });
    },
    async deliver(
      input: PreparedPush,
      signal: AbortSignal,
    ): Promise<ProviderSendResult> {
      const row = await deps.subscriptions.get(
        input.device.userId,
        input.device.id,
      );
      if (!row?.enabled) return { status: 'accepted' };
      let message = input.message;
      if (message.beforeSend) {
        const hook = hooks.get(message.beforeSend.name);
        if (!hook)
          return {
            status: 'failed',
            disposition: 'never',
            error: {
              category: 'provider',
              message: 'Web Push authorization hook unavailable.',
            },
          };
        const prepared = await hook(input, row, signal);
        if (prepared === false) return { status: 'accepted' };
        message = { ...message, ...prepared };
      }
      if (signal.aborted)
        return {
          status: 'failed',
          disposition: 'never',
          error: { category: 'timeout', message: 'Web Push send cancelled.' },
        };
      const url = pushTarget(message.url, deps.base);
      try {
        const status = await deps.transport(
          deps.subscriptions.open(row),
          {
            title: message.title,
            body: message.body ?? '',
            url,
            dedupeKey: message.dedupeKey,
          },
          signal,
        );
        if (status === 404 || status === 410)
          await deps.subscriptions.remove(row.userId, row.id);
        if (status >= 200 && status < 300) return { status: 'accepted' };
        return {
          status: 'failed',
          disposition:
            status === 429 || status >= 500 ? 'same_provider' : 'never',
          error: {
            category: status === 429 ? 'rate_limit' : 'provider',
            message: `Web Push service rejected the request (${status}).`,
          },
        };
      } catch {
        return {
          status: 'submission_unknown',
          error: {
            category: 'network',
            message: 'Web Push delivery could not be confirmed.',
          },
        };
      }
    },
  };
}
