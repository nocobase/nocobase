import {
  type SendingProvider,
  type SendingProviderContext,
  type SendingProviderSendInput,
} from '../src/index.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createResendProviderDefinition,
  defineResendProviderConfig,
} from '../src/email/providers/resend.js';
import type { PreparedEmailMessage } from '../src/email/types.js';

const resendMock = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock('resend', () => ({
  Resend: class {
    readonly emails = { send: resendMock.send };
  },
}));

describe('Resend Provider', () => {
  beforeEach(() => {
    resendMock.send.mockReset();
  });

  it('returns the Provider message ID after Resend accepts the email', async () => {
    resendMock.send.mockResolvedValue({
      data: { id: 'resend-message-1' },
      error: null,
      headers: null,
    });
    const provider = await createProvider();

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
      { idempotencyKey: 'delivery-1' },
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
    const provider = await createProvider();

    await expect(provider.send(sendInput())).resolves.toEqual({
      status: 'failed',
      disposition: 'same_provider',
      error: {
        code: 'rate_limit_exceeded',
        category: 'rate_limit',
        message: 'Too many requests',
      },
    });
  });

  it('marks a transport timeout as an unknown submission result', async () => {
    resendMock.send.mockRejectedValue(
      Object.assign(new Error('Request timed out'), { code: 'ETIMEDOUT' }),
    );
    const provider = await createProvider();

    await expect(provider.send(sendInput())).resolves.toEqual({
      status: 'submission_unknown',
      error: {
        code: 'ETIMEDOUT',
        category: 'timeout',
        message: 'Request timed out',
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
    const provider = await createProvider();

    await expect(provider.send(sendInput())).resolves.toEqual({
      status: 'submission_unknown',
      error: {
        code: 'application_error',
        category: 'network',
        message: 'The connection closed unexpectedly',
      },
    });
  });
});

async function createProvider(): Promise<
  SendingProvider<PreparedEmailMessage>
> {
  return createResendProviderDefinition().createProvider(
    providerContext(),
    defineResendProviderConfig({
      apiKey: 're_test',
      from: 'NocoBase <notifications@example.com>',
      replyTo: 'support@example.com',
    }),
  );
}

function providerContext(): SendingProviderContext {
  return {
    logger: {} as SendingProviderContext['logger'],
    async now(): Promise<string> {
      return '2026-08-26T00:00:00.000Z';
    },
  };
}

function sendInput(): SendingProviderSendInput<PreparedEmailMessage> {
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
