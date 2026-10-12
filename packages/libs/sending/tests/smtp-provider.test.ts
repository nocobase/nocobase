import type {
  SendingProvider,
  SendingProviderContext,
  SendingProviderSendInput,
} from '../src/index.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createSmtpProviderDefinition,
  defineSmtpProviderConfig,
} from '../src/email/providers/smtp.js';
import type { PreparedEmailMessage } from '../src/email/types.js';

const smtpMock = vi.hoisted(() => ({
  close: vi.fn(),
  sendMail: vi.fn(),
}));

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => smtpMock),
  },
}));

describe('SMTP Provider', () => {
  beforeEach(() => {
    smtpMock.close.mockReset();
    smtpMock.sendMail.mockReset();
  });

  it('returns the SMTP message ID after acceptance', async () => {
    smtpMock.sendMail.mockResolvedValue({ messageId: 'smtp-message-1' });
    const provider = await createProvider();

    expect(provider.capabilities).toBeUndefined();
    await expect(provider.send(sendInput())).resolves.toEqual({
      status: 'accepted',
      providerMessageId: 'smtp-message-1',
    });
    expect(smtpMock.sendMail).toHaveBeenCalledWith({
      from: 'NocoBase <notifications@example.com>',
      to: 'alice@example.com',
      subject: 'Approval complete',
      text: 'Review the result.',
      html: undefined,
      replyTo: 'support@example.com',
    });
  });

  it('maps authentication failures to a permanent stable error category', async () => {
    smtpMock.sendMail.mockRejectedValue(
      Object.assign(new Error('Invalid credentials'), { code: 'EAUTH' }),
    );
    const provider = await createProvider();

    await expect(provider.send(sendInput())).resolves.toEqual({
      status: 'failed',
      disposition: 'never',
      error: {
        code: 'EAUTH',
        category: 'authentication',
        message: 'Invalid credentials',
      },
    });
  });

  it('redacts credentials and recipient addresses from transport errors', async () => {
    smtpMock.sendMail.mockRejectedValue(
      Object.assign(
        new Error('authorization=secret-token recipient alice@example.com'),
        { code: 'EAUTH' },
      ),
    );
    const provider = await createProvider();

    const result = await provider.send(sendInput());
    expect(JSON.stringify(result)).not.toContain('secret-token');
    expect(JSON.stringify(result)).not.toContain('alice@example.com');
    expect(result).toMatchObject({
      status: 'failed',
      error: {
        code: 'EAUTH',
        category: 'authentication',
        message: 'authorization=[redacted] recipient [redacted-email]',
      },
    });
  });

  it.each([
    [450, 'same_provider'],
    [550, 'never'],
  ] as const)(
    'maps SMTP %i envelope responses to the %s disposition',
    async (responseCode, disposition) => {
      smtpMock.sendMail.mockRejectedValue(
        Object.assign(new Error(`SMTP ${responseCode}`), {
          code: 'EENVELOPE',
          responseCode,
        }),
      );
      const provider = await createProvider();

      await expect(provider.send(sendInput())).resolves.toEqual({
        status: 'failed',
        disposition,
        error: {
          code: 'EENVELOPE',
          category: 'recipient',
          message: `SMTP ${responseCode}`,
        },
      });
    },
  );

  it('keeps a connection timeout unknown because CONN is not a reliable phase marker', async () => {
    smtpMock.sendMail.mockRejectedValue(
      Object.assign(new Error('Connection timeout'), {
        code: 'ETIMEDOUT',
        command: 'CONN',
      }),
    );
    const provider = await createProvider();

    await expect(provider.send(sendInput())).resolves.toEqual({
      status: 'submission_unknown',
      error: {
        code: 'ETIMEDOUT',
        category: 'timeout',
        message: 'Connection timeout',
      },
    });
  });

  it('keeps a timeout after SMTP submission as unknown', async () => {
    smtpMock.sendMail.mockRejectedValue(
      Object.assign(new Error('Response timeout'), {
        code: 'ETIMEDOUT',
        command: 'DATA',
      }),
    );
    const provider = await createProvider();

    await expect(provider.send(sendInput())).resolves.toEqual({
      status: 'submission_unknown',
      error: {
        code: 'ETIMEDOUT',
        category: 'timeout',
        message: 'Response timeout',
      },
    });
  });

  it.each(['ESOCKET', 'ECONNECTION'] as const)(
    'keeps ambiguous %s failures unknown even when Nodemailer reports CONN',
    async (code) => {
      smtpMock.sendMail.mockRejectedValue(
        Object.assign(new Error('Connection failed'), {
          code,
          command: 'CONN',
        }),
      );
      const provider = await createProvider();

      await expect(provider.send(sendInput())).resolves.toMatchObject({
        status: 'submission_unknown',
        error: { code, category: 'network' },
      });
    },
  );

  it.each(['ESOCKET', 'ECONNECTION'] as const)(
    'marks %s after SMTP submission as unknown',
    async (code) => {
      smtpMock.sendMail.mockRejectedValue(
        Object.assign(new Error('Connection lost'), { code, command: 'DATA' }),
      );
      const provider = await createProvider();

      await expect(provider.send(sendInput())).resolves.toMatchObject({
        status: 'submission_unknown',
        error: { code, category: 'network' },
      });
    },
  );

  it.each([
    ['CONN', 'submission_unknown'],
    ['DATA', 'submission_unknown'],
  ] as const)(
    'uses a nested transport error code during %s',
    async (command, status) => {
      smtpMock.sendMail.mockRejectedValue(
        Object.assign(new Error('Wrapped connection lost'), {
          command,
          cause: Object.assign(new Error('Socket failed'), { code: 'ESOCKET' }),
        }),
      );
      const provider = await createProvider();

      await expect(provider.send(sendInput())).resolves.toMatchObject({
        status,
        error: { code: 'ESOCKET', category: 'network' },
      });
    },
  );

  it.each(['ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN'] as const)(
    'retries %s because it proves submission did not start',
    async (code) => {
      smtpMock.sendMail.mockRejectedValue(
        Object.assign(new Error('Connection not established'), { code }),
      );
      const provider = await createProvider();

      await expect(provider.send(sendInput())).resolves.toMatchObject({
        status: 'failed',
        disposition: 'same_provider',
        error: { code, category: 'network' },
      });
    },
  );
});

async function createProvider(): Promise<
  SendingProvider<PreparedEmailMessage>
> {
  return createSmtpProviderDefinition().createProvider(
    providerContext(),
    defineSmtpProviderConfig({
      host: 'smtp.example.com',
      port: 587,
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
