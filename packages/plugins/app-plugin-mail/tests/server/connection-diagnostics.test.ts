import { MailProviderRequestError } from '../../server/services/errors.js';
import { createServer } from 'node:net';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createImapClient } from '../../server/adapters/imap-smtp/connection.js';
import { classifyError } from '../../server/adapters/imap-smtp/errors.js';
import {
  MailConnectionError,
  logMailFailure,
  failureStage,
  redactMailText,
} from '../../server/connection-diagnostics.js';
import { diagnosticFetch } from '../../server/diagnostic-fetch.js';
import { mailLogCode, mailLogError } from '../../server/logging.js';

const endpoint = { host: '127.0.0.1', port: 993, secure: false };
const credential = {
  username: 'diagnostic-user',
  password: 'diagnostic-password',
};

describe('credential-safe connection diagnostics', () => {
  it.each([
    [{ code: 'ENOTFOUND' }, 'dns', 'HostNotFound'],
    [{ code: 'CONNECT_TIMEOUT' }, 'connect', 'ConnectionTimeout'],
    [{ code: 'ECONNRESET', command: 'AUTH PLAIN' }, 'auth', 'ConnectionLost'],
    [
      { code: 'ESOCKET', originalCode: 'ECONNREFUSED' },
      'connect',
      'ConnectionRefused',
    ],
    [{ code: 'EAUTH', responseCode: 535 }, 'auth', 'AuthenticationFailed'],
    [{ code: 'GREETING_TIMEOUT' }, 'greeting', 'ConnectionTimeout'],
    [
      {
        code: 'ETIMEDOUT',
        command: 'CONN',
        message: 'Greeting never received',
      },
      'greeting',
      'ConnectionTimeout',
    ],
    [{ code: 'ETIMEOUT', syscall: 'connect' }, 'connect', 'ConnectionTimeout'],
    [{ code: 'ERR_SSL_WRONG_VERSION_NUMBER' }, 'tls', 'TlsFailed'],
    [{ code: 'DEPTH_ZERO_SELF_SIGNED_CERT' }, 'tls', 'CertificateInvalid'],
    [
      {
        code: 'ETLS',
        message: 'Error initiating TLS - self-signed certificate',
      },
      'tls',
      'CertificateInvalid',
    ],
    [{ code: 'EPIPE' }, 'sync', 'ConnectionFailed'],
  ] as const)(
    'classifies %j from actual error evidence',
    (cause, stage, reason) => {
      const error = new MailConnectionError('smtp', cause, 12, 'sync');
      expect(failureStage(error, 'sync')).toBe(stage);
      expect(classifyError(error, 'SMTP_CONNECT').reasonCode).toBe(
        `smtp${reason}`,
      );
    },
  );

  it('whitelists fields, scrubs credentials before truncation and records STARTTLS accurately', () => {
    const logger = { warn: vi.fn() };
    const secrets = [
      'diagnostic-password',
      'private-token',
      'private-code',
      'credential-reference',
      'diagnostic-user',
    ];
    const text = `${secrets.join(' ')} user@example.com ${'x'.repeat(300)}`;
    const error = Object.assign(new Error(text), {
      code: 'EAUTH',
      responseText: text,
      responseCode: 535,
      command: 'AUTH PLAIN c2VjcmV0',
      request: { accessToken: 'private-token' },
      stack: text,
    });
    logMailFailure(error, classifyError(error, 'CONNECT'), {
      logger,
      event: 'mail.account.connect_failed',
      provider: 'imap-smtp',
      accountId: 'account',
      address: 'user@example.com',
      protocol: 'imap',
      endpoint,
      stage: 'connect',
      startedAt: Date.now() - 5,
      secrets,
    });
    expect(logger.warn).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        stage: 'auth',
        address: '***@example.com',
        host: '127.0.0.1',
        starttls: 'opportunistic',
        secure: false,
        rejectUnauthorized: true,
        responseCode: 535,
        retryable: false,
        category: 'authentication',
      }),
      expect.any(String),
    );
    const data = logger.warn.mock.calls[0][0];
    expect(data.message.length).toBeLessThanOrEqual(200);
    expect(data.responseText.length).toBeLessThanOrEqual(200);
    const serialized = JSON.stringify(data);
    for (const value of [
      ...secrets,
      'user@example.com',
      'stack',
      'command',
      'request',
      'c2VjcmV0',
    ])
      expect(serialized).not.toContain(value);
    expect(redactMailText(encodeURIComponent('private-token'), secrets)).toBe(
      '[REDACTED]',
    );
    expect(
      redactMailText(Buffer.from('private-token').toString('base64'), secrets),
    ).toBe('[REDACTED]');
    expect(mailLogError(new Error(text))).toEqual({
      message: 'Mail operation failed.',
    });
    expect(mailLogCode('private-token')).toBe('MAIL_PROVIDER_FAILURE');
    const propagated = new MailProviderRequestError(
      classifyError(error, 'CONNECT'),
      { cause: error },
    );
    expect(propagated.message).toBe('Mail provider request failed.');
    expect(
      JSON.stringify({
        message: propagated.message,
        stack: propagated.stack,
        cause:
          propagated.cause instanceof Error
            ? propagated.cause.message
            : undefined,
      }),
    ).not.toContain('diagnostic-password');
  });

  it('keeps HTTP failures opaque and preserves native network diagnostics and result semantics', async () => {
    const logger = { warn: vi.fn() };
    const context = {
      logger,
      provider: 'gmail',
      accountId: 'account',
      stage: 'send' as const,
      secrets: ['client-secret', 'refresh-token'],
    };
    const error = Object.assign(
      new Error(
        'access-token refresh-token client-secret private-code private-verifier',
      ),
      {
        cause: { code: 'ENOTFOUND', syscall: 'getaddrinfo' },
        request: { password: 'extra-private-value' },
      },
    );
    const init = {
      headers: { authorization: 'Bearer access-token' },
      body: new URLSearchParams({
        code: 'private-code',
        code_verifier: 'private-verifier',
      }),
    };
    await expect(
      diagnosticFetch(
        async () => {
          throw error;
        },
        'https://example.invalid',
        init,
        context,
      ),
    ).rejects.toBe(error);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'ENOTFOUND',
        syscall: 'getaddrinfo',
        stage: 'dns',
        event: 'mail.gmail.send_failed',
        durationMs: expect.any(Number),
      }),
      expect.any(String),
    );
    for (const secret of [
      'access-token',
      'refresh-token',
      'client-secret',
      'private-code',
      'private-verifier',
      'extra-private-value',
    ])
      expect(JSON.stringify(logger.warn.mock.calls)).not.toContain(secret);
    logger.warn.mockClear();
    const response = new Response('ok');
    expect(
      await diagnosticFetch(
        async () => response,
        'https://example.invalid',
        {},
        context,
      ),
    ).toBe(response);
    expect(logger.warn).not.toHaveBeenCalled();
    logger.warn.mockImplementation(() => {
      throw new Error('Logger unavailable');
    });
    const denied = new Response('private-body', { status: 403 });
    expect(
      await diagnosticFetch(
        async () => denied,
        'https://example.invalid',
        {},
        context,
      ),
    ).toBe(denied);
  });
});

describe('native IMAP socket failures', () => {
  const servers: ReturnType<typeof createServer>[] = [];
  afterEach(async () => {
    for (const server of servers.splice(0))
      await new Promise<void>((resolve) => server.close(() => resolve()));
  });
  async function listen(mode: 'silent' | 'plain'): Promise<number> {
    const server = createServer((socket) => {
      socket.resume();
      socket.on('error', () => undefined);
      if (mode === 'plain') socket.end('* OK plaintext IMAP service\r\n');
    });
    servers.push(server);
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    const address = server.address();
    if (!address || typeof address === 'string')
      throw new Error('TCP port unavailable');
    return address.port;
  }
  it.each(['dns', 'refused', 'tls', 'greeting'] as const)(
    'reports an actual %s failure',
    async (mode) => {
      const port = await listen(mode === 'tls' ? 'plain' : 'silent');
      if (mode === 'refused')
        await new Promise<void>((resolve) => servers[0].close(() => resolve()));
      const client = createImapClient(
        {
          ...endpoint,
          host: mode === 'dns' ? 'mail-diagnostics.invalid' : '127.0.0.1',
          port,
          secure: mode === 'tls',
        },
        credential,
      );
      client.options.greetingTimeout = 100;
      client.options.connectionTimeout = 1000;
      try {
        const error = await client.connect().then(
          () => {
            throw new Error('Connection unexpectedly succeeded');
          },
          (error) => error as unknown,
        );
        expect(failureStage(error, 'connect')).toBe(
          mode === 'refused' ? 'connect' : mode,
        );
        const classified = classifyError(
          new MailConnectionError('imap', error, 0),
          'IMAP_CONNECT',
        );
        expect(classified.reasonCode).toBe(
          `imap${{ dns: 'HostNotFound', refused: 'ConnectionRefused', tls: 'TlsFailed', greeting: 'ConnectionTimeout' }[mode]}`,
        );
      } finally {
        client.close();
      }
    },
  );
});
