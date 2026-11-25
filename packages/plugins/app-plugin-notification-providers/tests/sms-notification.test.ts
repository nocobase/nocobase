// @vitest-environment node
import { createRequire } from 'node:module';
import path from 'node:path';

import {
  NotificationTemplateRegistry,
  createDatabaseNotificationStore,
  createNotificationManager,
  createNotificationRegistry,
  type NotificationChannelConfigInput,
} from '@nocobase/app-plugin-notification';
import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import { createLogger } from '@nocobase/logging';
import { ServiceContainer } from '@nocobase/service-provider';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { registerBuiltInNotificationProviders } from '../server/bootstrap.js';
import { userPhoneDirectoryToken } from '../server/sms/index.js';
import { InlineJobExecutor } from './helpers/inline-job-executor.js';

const migrations = path.join(
  path.dirname(
    createRequire(import.meta.url).resolve(
      '@nocobase/app-plugin-notification/package.json',
    ),
  ),
  'database/migrations',
);

const SECRET = 'aliyun-secret-never-logged';
const channels: Record<string, NotificationChannelConfigInput> = {
  sms: {
    type: 'sms',
    service: 'aliyun',
    signName: 'Example',
    aliyun: { accessKeyId: 'LTAIexample', accessKeySecret: SECRET },
    templates: {
      code: { templateId: 'SMS_CODE', params: { code: 'code' } },
      notification: {
        templateId: 'SMS_NOTICE',
        params: { title: 'title', body: 'body' },
      },
    },
  } as never,
};

let db: TestDatabase;
let logs: string[];
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  db = await createTestDatabase({
    migrations: [
      {
        packageName: '@nocobase/app-plugin-notification',
        directory: migrations,
      },
    ],
  });
  logs = [];
  fetchMock = vi.fn(async () =>
    Response.json({ Code: 'OK', BizId: 'biz-1', RequestId: 'req-1' }),
  );
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(async () => {
  vi.unstubAllGlobals();
  await db.destroy();
});

async function harness() {
  const registry = createNotificationRegistry();
  registerBuiltInNotificationProviders(registry);
  const kinds = new NotificationTemplateRegistry();
  kinds.register({
    id: 'approval.requested',
    contributor: '@example/approvals',
    category: 'Approvals',
    name: 'Approval requested',
    trigger: 'Someone asks for approval',
    recipients: 'Approvers',
    businessRule: 'Every request',
    locales: ['en-US'],
    languagePolicy: 'The application language',
    variables: [{ name: 'title', description: 'Request title' }],
    channels: { sms: 'on' },
    content: ({ data }) => ({
      title: String(data.title),
      body: 'Please review.',
    }),
    sample: { title: 'Sample' },
  });
  const container = new ServiceContainer();
  container.instance(userPhoneDirectoryToken, {
    find: async (userIds) =>
      new Map(
        userIds.flatMap((id) =>
          id === 'alice' ? [[id, '+8613800138000'] as const] : [],
        ),
      ),
  });
  const logger = createLogger({ level: 'silent' });
  for (const level of ['info', 'warn', 'error', 'debug'] as const)
    vi.spyOn(logger, level).mockImplementation(((...args: unknown[]) => {
      logs.push(JSON.stringify(args));
    }) as never);
  const manager = createNotificationManager({
    database: db.database,
    store: createDatabaseNotificationStore(db.database),
    executor: new InlineJobExecutor(),
    logger,
    registry,
    kinds,
    container,
    defaultLocale: () => 'en-US',
    config: { channels },
  });
  return manager;
}

describe('SMS through the notification manager', () => {
  it('sends a test message to the administrator’s verified phone', async () => {
    const manager = await harness();
    try {
      const sent = await manager.testChannel('sms', {
        userId: 'alice',
        title: 'Test',
        body: 'It works.',
      });
      expect(sent.status).toBe('completed');
      expect(fetchMock).toHaveBeenCalledOnce();
      const body = new URLSearchParams(
        String(fetchMock.mock.calls[0]![1].body),
      );
      expect(body.get('PhoneNumbers')).toBe('13800138000');
      expect(body.get('TemplateCode')).toBe('SMS_NOTICE');
      expect(JSON.parse(body.get('TemplateParam')!)).toEqual({
        title: 'Test',
        body: 'It works.',
      });
    } finally {
      await manager.close();
    }
  });

  it('refuses a test for an administrator with no verified phone', async () => {
    const manager = await harness();
    try {
      await expect(
        manager.testChannel('sms', { userId: 'bob', title: 'T', body: 'B' }),
      ).rejects.toMatchObject({ code: 'NOTIFICATION_CHANNEL_NO_RECIPIENT' });
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      await manager.close();
    }
  });

  it('shows the administrator why a test failed', async () => {
    fetchMock.mockResolvedValue(
      Response.json({
        Code: 'isv.SMS_SIGNATURE_ILLEGAL',
        Message: 'sign illegal',
        RequestId: 'req-9',
      }),
    );
    const manager = await harness();
    try {
      const sent = await manager.testChannel('sms', {
        userId: 'alice',
        title: 'Test',
        body: 'It works.',
      });
      const status = await manager.getNotification(sent.notificationId);
      const error = status!.deliveries[0]!.error!;
      expect(error).toMatchObject({
        code: 'SMS_SIGNATURE_INVALID',
        category: 'configuration',
      });
      expect(error.message).toMatch(/signature.*approved.*req-9/su);
      expect(JSON.stringify(status)).not.toContain(SECRET);
    } finally {
      await manager.close();
    }
  });

  it('notifies the users a kind selects the sms channel for, skipping those without a phone', async () => {
    const manager = await harness();
    try {
      const result = await manager.notify('approval.requested', {
        to: ['alice', 'bob'],
        data: { title: 'Budget' },
        idempotencyKey: 'approval-1',
      });
      expect(result.send?.deliveries).toHaveLength(1);
      expect(result.send?.deliveries[0]).toMatchObject({
        channelName: 'sms',
        channelType: 'sms',
        status: 'accepted',
      });
      expect(fetchMock).toHaveBeenCalledOnce();
      expect(JSON.stringify(result)).toContain('no_recipient');
    } finally {
      await manager.close();
    }
  });

  it('sends a code once, keeping it and the secret out of storage and logs', async () => {
    const manager = await harness();
    try {
      const results = await manager.sendTransient({
        channel: 'sms',
        message: {
          to: '+8613800138000',
          template: 'code',
          params: { code: '246810' },
        },
      });
      expect(results).toEqual([{ status: 'accepted' }]);
      const body = new URLSearchParams(
        String(fetchMock.mock.calls[0]![1].body),
      );
      expect(JSON.parse(body.get('TemplateParam')!)).toEqual({
        code: '246810',
      });

      const connection = db.database.connection();
      for (const table of [
        'notificationDispatches',
        'notificationDeliveries',
        'notificationDeliveryAttempts',
      ])
        expect(
          await connection.query.selectFrom(table).selectAll().execute(),
        ).toEqual([]);
      expect(logs.join('\n')).not.toMatch(new RegExp(`246810|${SECRET}`, 'u'));
    } finally {
      await manager.close();
    }
  });

  it('gives a failed code send a category without the provider’s text', async () => {
    fetchMock.mockResolvedValue(
      Response.json({ Code: 'isv.BUSINESS_LIMIT_CONTROL', Message: '246810' }),
    );
    const manager = await harness();
    try {
      const [result] = await manager.sendTransient({
        channel: 'sms',
        message: {
          to: '+8613800138000',
          template: 'code',
          params: { code: '246810' },
        },
      });
      expect(result).toMatchObject({
        status: 'failed',
        error: { category: 'rate_limit' },
      });
      expect(JSON.stringify(result)).not.toContain('246810');
    } finally {
      await manager.close();
    }
  });
});
