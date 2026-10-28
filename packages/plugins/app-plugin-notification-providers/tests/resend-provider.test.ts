import { createMailer, mailerToken } from '@nocobase/app-server/mailer';
import { ServiceContainer } from '@nocobase/service-provider';
import {
  type NotificationProvider,
  type NotificationProviderContext,
  type NotificationProviderSendInput,
} from '@nocobase/app-plugin-notification';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ResendChannel,
  createResendProviderDefinition,
  defineResendProviderConfig,
} from '../server/email/providers/resend.js';
import type { PreparedEmailMessage } from '../server/email/types.js';

const resendMock = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock('resend', () => ({
  Resend: class {
    readonly emails = { send: resendMock.send };
  },
}));

const modes = ['legacy', 'class', 'standalone'] as const;

describe.each(modes)('Resend %s', (mode) => {
  beforeEach(() => {
    resendMock.send.mockReset();
  });

  it('returns the Provider message ID after Resend accepts the email', async () => {
    resendMock.send.mockResolvedValue({
      data: { id: 'resend-message-1' },
      error: null,
      headers: null,
    });
    const provider = await createProvider(mode);

    expect(provider.capabilities).toEqual({
      idempotency: {
        supported: true,
        retentionMs: 86_400_000,
      },
    });
    await expect(provider.send(sendInput())).resolves.toEqual({
      status: 'accepted',
      providerMessageId: 'resend-message-1',
    });
    expect(resendMock.send).toHaveBeenCalledWith(
      {
        from: 'NocoBase <notifications@example.com>',
        to: 'alice@example.com',
        subject: 'Approval complete',
        text: 'Review the result.',
        html: undefined,
        replyTo: 'support@example.com',
      },
      { idempotencyKey: 'delivery-1', signal: expect.any(AbortSignal) },
    );
  });

  it('maps Resend rate limits to a retryable stable error category', async () => {
    resendMock.send.mockResolvedValue({
      data: null,
      error: {
        name: 'rate_limit_exceeded',
        message: 'Too many requests',
        statusCode: 429,
      },
      headers: null,
    });
    const provider = await createProvider(mode);

    await expect(provider.send(sendInput())).resolves.toEqual({
      status: 'failed',
      disposition: 'same_provider',
      error: {
        code: 'rate_limit_exceeded',
        category: 'rate_limit',
        message: 'Resend request failed.',
      },
    });
  });

  it('marks a transport timeout as an unknown submission result', async () => {
    resendMock.send.mockRejectedValue(
      Object.assign(new Error('Request timed out'), { code: 'ETIMEDOUT' }),
    );
    const provider = await createProvider(mode);

    await expect(provider.send(sendInput())).resolves.toEqual({
      status: 'submission_unknown',
      error: {
        code: 'ETIMEDOUT',
        category: 'timeout',
        message: 'Resend request failed.',
      },
    });
  });

  it('keeps an SDK application error with no status as an unknown submission', async () => {
    resendMock.send.mockResolvedValue({
      data: null,
      error: {
        name: 'application_error',
        message: 'The connection closed unexpectedly',
        statusCode: null,
      },
      headers: null,
    });
    const provider = await createProvider(mode);

    await expect(provider.send(sendInput())).resolves.toEqual({
      status: 'submission_unknown',
      error: {
        code: 'application_error',
        category: 'network',
        message: 'Resend request failed.',
      },
    });
  });
});

async function createProvider(
  mode: 'legacy' | 'class' | 'standalone',
): Promise<
  Pick<NotificationProvider<PreparedEmailMessage>, 'send' | 'capabilities'>
> {
  if (mode !== 'legacy') {
    const container = new ServiceContainer();
    if (mode === 'class')
      container.instance(
        mailerToken,
        createMailer({
          channels: {
            email: {
              type: 'resend',
              apiKey: 're_test',
              from: 'NocoBase <notifications@example.com>',
              replyTo: 'support@example.com',
            },
          },
        }),
      );
    return new ResendChannel(
      { channelName: 'email', container },
      {
        type: 'resend',
        apiKey: 're_test',
        from: 'NocoBase <notifications@example.com>',
        replyTo: 'support@example.com',
      },
    );
  }
  return createResendProviderDefinition().createProvider(
    providerContext(),
    defineResendProviderConfig({
      apiKey: 're_test',
      from: 'NocoBase <notifications@example.com>',
      replyTo: 'support@example.com',
    }),
  );
}

function providerContext(): NotificationProviderContext {
  return {
    logger: {} as NotificationProviderContext['logger'],
    async now(): Promise<string> {
      return '2026-08-26T00:00:00.000Z';
    },
  };
}

function sendInput(): NotificationProviderSendInput<PreparedEmailMessage> {
  return {
    notificationId: 'notification-1',
    deliveryId: 'delivery-1',
    attemptId: 'attempt-1',
    deadline: '2026-08-26T00:01:00.000Z',
    signal: new AbortController().signal,
    message: {
      to: 'alice@example.com',
      content: {
        subject: 'Approval complete',
        text: 'Review the result.',
      },
    },
  };
}
