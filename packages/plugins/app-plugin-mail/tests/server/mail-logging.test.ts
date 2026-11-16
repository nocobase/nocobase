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
            message: 'Mail operation failed.',
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

  it('omits arbitrary error text, stacks and SDK credential objects', () => {
    const error = Object.assign(new Error('SMTP connection failed'), {
      request: { password: 'private-password', body: 'private-body' },
      accessToken: 'private-token',
    });
    const serialized = JSON.parse(JSON.stringify(mailLogError(error)));
    expect(serialized).toEqual({
      message: 'Mail operation failed.',
    });
  });
  it('only copies the message from provider failures and handles non-Error exceptions', () => {
    expect(
      mailLogError({
        message: 'Provider rejected request',
        request: { token: 'secret' },
      }),
    ).toEqual({ message: 'Mail operation failed.' });
    expect(mailLogError('Connection lost')).toEqual({
      message: 'Mail operation failed.',
    });
    expect(mailLogError(null)).toEqual({ message: 'Mail operation failed.' });
    expect(mailLogError({ message: { token: 'secret' } })).toEqual({
      message: 'Mail operation failed.',
    });
  });
});
