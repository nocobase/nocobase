import { createHash, randomUUID } from 'node:crypto';
import type { DatabaseConnection } from '@nocobase/db';
import type { SecretsService } from '@nocobase/app-server/secrets';
import { z } from 'zod';

export const PUSH_SECRET_PURPOSE = 'web-push/subscription';
export interface SubscriptionInputValue {
  name: string;
  locale: 'en-US' | 'zh-CN';
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
}
export const SubscriptionInput: z.ZodType<SubscriptionInputValue> = z.object({
  name: z.string().trim().min(1).max(100),
  locale: z.enum(['en-US', 'zh-CN']),
  subscription: z.object({
    endpoint: z.string().url().max(4096),
    keys: z.object({
      p256dh: z.string().regex(/^[\w-]{87}$/u),
      auth: z.string().regex(/^[\w-]{22}$/u),
    }),
  }),
});
export interface SubscriptionRow {
  id: string;
  userId: string;
  endpointHash: string;
  subscriptionSealed: string;
  name: string;
  locale: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}
export type Device = Pick<
  SubscriptionRow,
  'id' | 'name' | 'locale' | 'enabled' | 'createdAt' | 'updatedAt'
>;
export class PushError extends Error {
  constructor(
    public readonly code:
      'unavailable' | 'endpoint' | 'owned' | 'missing' | 'limited',
  ) {
    super(`Web Push ${code}.`);
  }
}
/** A closed set of browser vendors prevents subscription APIs becoming an arbitrary HTTP client. */
export function validateEndpoint(value: string): URL {
  const url = new URL(value);
  const host = url.hostname.toLowerCase();
  if (
    url.protocol !== 'https:' ||
    url.port ||
    url.username ||
    url.password ||
    url.hash ||
    !(
      host === 'fcm.googleapis.com' ||
      host === 'updates.push.services.mozilla.com' ||
      host.endsWith('.push.apple.com') ||
      host.endsWith('.notify.windows.com')
    )
  )
    throw new PushError('endpoint');
  return url;
}
export const publicDevice = (row: SubscriptionRow): Device => ({
  id: row.id,
  name: row.name,
  locale: row.locale,
  enabled: row.enabled,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});
export interface Subscriptions {
  readonly ready: boolean;
  list(userId: string): Promise<Device[]>;
  enabled(): Promise<SubscriptionRow[]>;
  forUser(userId: string): Promise<SubscriptionRow[]>;
  get(userId: string, id: string): Promise<SubscriptionRow | null>;
  save(userId: string, input: SubscriptionInputValue): Promise<Device>;
  update(userId: string, id: string, enabled: boolean): Promise<void>;
  remove(userId: string, id: string): Promise<void>;
  open(row: SubscriptionRow): SubscriptionInputValue['subscription'];
}
export function createSubscriptions(
  connection: () => DatabaseConnection,
  secrets: Pick<SecretsService, 'ready' | 'seal' | 'open'>,
): Subscriptions {
  const rows = () =>
    connection().repository<SubscriptionRow>('webPushSubscriptions');
  return {
    get ready(): boolean {
      return secrets.ready;
    },
    async list(userId: string): Promise<Device[]> {
      return (await rows().findMany({ filter: { userId } })).map(publicDevice);
    },
    async enabled(): Promise<SubscriptionRow[]> {
      return rows().findMany({ filter: { enabled: true } });
    },
    async forUser(userId: string): Promise<SubscriptionRow[]> {
      return rows().findMany({ filter: { userId, enabled: true } });
    },
    async get(userId: string, id: string): Promise<SubscriptionRow | null> {
      return (await rows().findOne({ filter: { id, userId } })) ?? null;
    },
    async save(
      userId: string,
      input: z.infer<typeof SubscriptionInput>,
    ): Promise<Device> {
      if (!secrets.ready) throw new PushError('unavailable');
      const subscription = {
        ...input.subscription,
        endpoint: validateEndpoint(input.subscription.endpoint).href,
      };
      const endpointHash = createHash('sha256')
        .update(subscription.endpoint)
        .digest('hex');
      const previous = await rows().findOne({ filter: { endpointHash } });
      if (previous && previous.userId !== userId) throw new PushError('owned');
      const id = previous?.id ?? randomUUID();
      const now = new Date().toISOString();
      const values = {
        name: input.name,
        locale: input.locale,
        enabled: true,
        updatedAt: now,
        subscriptionSealed: secrets.seal(JSON.stringify(subscription), {
          purpose: PUSH_SECRET_PURPOSE,
          aad: [id, userId],
        }),
      };
      if (previous) await rows().updateMany({ filter: { id, userId }, values });
      else
        await rows().createOne({
          values: { id, userId, endpointHash, createdAt: now, ...values },
        });
      return publicDevice({
        id,
        userId,
        endpointHash,
        createdAt: previous?.createdAt ?? now,
        ...values,
      });
    },
    async update(userId: string, id: string, enabled: boolean): Promise<void> {
      const changed = await rows().updateMany({
        filter: { id, userId },
        values: { enabled, updatedAt: new Date().toISOString() },
      });
      if (!changed.updatedCount) throw new PushError('missing');
    },
    async remove(userId: string, id: string): Promise<void> {
      await rows().deleteMany({ filter: { id, userId } });
    },
    open(
      row: SubscriptionRow,
    ): z.infer<typeof SubscriptionInput>['subscription'] {
      return SubscriptionInput.parse({
        name: row.name,
        locale: row.locale,
        subscription: JSON.parse(
          secrets.open(row.subscriptionSealed, {
            purpose: PUSH_SECRET_PURPOSE,
            aad: [row.id, row.userId],
          }),
        ) as unknown,
      }).subscription;
    },
  };
}
