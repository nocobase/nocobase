import { expectTypeOf, it } from 'vitest';
import {
  createNotificationManager,
  type NotificationSendInput,
  type ConfiguredNotificationChannels,
} from '@nocobase/app-plugin-notification';
import '../server/email/channel.js';
import '../server/im/channel.js';

const channels = {
  'system-email': { provider: 'smtp', host: 'localhost', port: 587 },
  marketing: { provider: 'resend', apiKey: 'key', from: 'a@example.com' },
  alerts: { provider: 'feishu-webhook', webhookUrl: 'https://example.com' },
} as const;
type Input = NotificationSendInput<
  ConfiguredNotificationChannels<typeof channels>
>;

it('infers Channel names, Provider messages and native recipients from configuration', () => {
  expectTypeOf<keyof Input['messages']>().toEqualTypeOf<
    'system-email' | 'marketing' | 'alerts'
  >();
  expectTypeOf<
    NonNullable<Input['messages']['system-email']>['to']
  >().toEqualTypeOf<string | readonly [string, ...string[]]>();
  expectTypeOf<
    NonNullable<Input['messages']['alerts']>['to']
  >().toEqualTypeOf<undefined>();
  expectTypeOf(
    createNotificationManager({
      database: {} as never,
      executor: {} as never,
      logger: {} as never,
      config: { channels },
    }).send,
  )
    .parameter(0)
    .toEqualTypeOf<Input>();
  const valid: Input = {
    idempotencyKey: 'typed',
    messages: {
      'system-email': {
        to: ['a@example.com'],
        subject: 'Hello',
        html: '<p>Hello</p>',
      },
      alerts: { text: 'Hello' },
    },
  };
  const invalidName: Input = {
    ...valid,
    messages: {
      // @ts-expect-error Dispatch keys are configured Channel names.
      email: { subject: 'Hello' },
    },
  };
  const invalidRecipient: Input = {
    ...valid,
    messages: {
      // @ts-expect-error Webhook messages cannot specify a recipient.
      alerts: { text: 'Hello', to: '123' },
    },
  };
  const emptyRecipients: Input = {
    ...valid,
    messages: {
      // @ts-expect-error Email recipient arrays must be non-empty.
      'system-email': { to: [], subject: 'Hello', text: 'Hello' },
    },
  };
  expectTypeOf(invalidName).toEqualTypeOf<Input>();
  expectTypeOf(invalidRecipient).toEqualTypeOf<Input>();
  expectTypeOf(emptyRecipients).toEqualTypeOf<Input>();
});
