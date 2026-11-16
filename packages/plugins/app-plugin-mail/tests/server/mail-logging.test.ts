import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AppConfig, createAppPaths } from '@nocobase/app-server/config';
import { LoggingProvider, loggingToken } from '@nocobase/app-server/logging';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { mailLogError, writeMailLog } from '../../server/logging.js';

describe('Mail error serialization', () => {
  it('writes readable structured Mail errors through the production file transport', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'mail-file-logging-'));
    const config = new AppConfig();
    await config.loadAll();
    config.mergeDefaults({
      logging: { level: 'info', console: { enabled: false } },
    });
    const container = new ServiceContainer();
    const provider = new LoggingProvider({
      appName: 'mail-test',
      publicBasePath: '/',
      config,
      container,
      paths: createAppPaths({ rootDir: directory }),
      router: new Hono(),
    });
    provider.register();
    try {
      const logger = container
        .resolve(loggingToken)
        .getLogger('system')
        .child({ module: 'mail' });
      const error = Object.assign(new Error('Mail transport unavailable'), {
        request: { accessToken: 'private-token', body: 'private-body' },
      });
      writeMailLog(
        logger,
        'error',
        {
          event: 'mail.send.exception',
          accountId: 'account',
          submissionId: 'submission',
          err: mailLogError(error),
        },
        'Mail Provider operation failed.',
      );
      await provider.shutdown();
      const logs = join(directory, 'storage/logs');
      const contents = (
        await Promise.all(
          (await readdir(logs))
            .filter((file) => file.endsWith('.log'))
            .map((file) => readFile(join(logs, file), 'utf8')),
        )
      ).join('');
      const records: unknown[] = contents
        .trim()
        .split('\n')
        .map((line) => JSON.parse(line) as unknown);
      expect(records).toContainEqual(
        expect.objectContaining({
          module: 'mail',
          logger: 'system',
          accountId: 'account',
          submissionId: 'submission',
          err: expect.objectContaining({
            type: 'Error',
            message: error.message,
            stack: expect.stringContaining('mail-logging.test.ts'),
          }),
        }),
      );
      expect(contents).not.toContain('private-token');
      expect(contents).not.toContain('private-body');
    } finally {
      await provider.shutdown();
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('preserves sanitized database diagnostics and frame locations without payloads or stack messages', () => {
    const error = Object.assign(
      new TypeError(
        'Missing column in users: password=private-password token=private-token user@example.com',
      ),
      {
        code: 'SQLITE_ERROR',
        request: { body: 'private-body' },
        stack:
          'TypeError: private-password\nprivate-token\n    at loadMailbox (/app/mail.ts:42:7)\n    at callback (https://example.invalid/callback?code=private-code:4:2)',
      },
    );
    const serialized = mailLogError(error);
    expect(serialized).toMatchObject({
      type: 'TypeError',
      code: 'SQLITE_ERROR',
      message: expect.stringContaining('Missing column in users'),
      stack: expect.stringContaining('/app/mail.ts:42:7'),
    });
    for (const secret of [
      'private-password',
      'private-token',
      'private-body',
      'private-code',
      'user@example.com',
      'TypeError:',
    ])
      expect(JSON.stringify(serialized)).not.toContain(secret);
    expect(serialized.message).toContain('***@example.com');
  });

  it('redacts explicit credentials in messages and stack frames', () => {
    const error = new Error('private-password private-code');
    error.stack =
      'Error: private-code\n    at private-password (/app/private-code.ts:4:2)';
    const serialized = mailLogError(error, [
      'private-password',
      'private-code',
    ]);
    expect(serialized).toEqual({
      type: 'Error',
      message: '[REDACTED] [REDACTED]',
      stack: '    at [REDACTED] (/app/[REDACTED].ts:4:2)',
    });
  });

  it('keeps unscoped provider payloads opaque and handles non-Error exceptions', () => {
    expect(
      mailLogError({
        message: 'private-provider-secret',
        code: 'HTTP_429',
        category: 'rate_limit',
        retryable: true,
        request: { token: 'secret' },
      }),
    ).toEqual({ message: 'Mail provider operation failed.', code: 'HTTP_429' });
    expect(
      mailLogError({
        message: 'Provider rejected request',
        request: { token: 'secret' },
      }),
    ).toEqual({ message: 'Provider rejected request' });
    expect(mailLogError('Connection lost')).toEqual({
      message: 'Connection lost',
    });
    expect(mailLogError(null)).toEqual({ message: 'Unknown mail error' });
    expect(mailLogError({ message: { token: 'secret' } })).toEqual({
      message: 'Unknown mail error',
    });
  });
});
