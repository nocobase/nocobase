import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import {
  createLogging,
  createSilentLoggingConfig,
  isLoggerLevel,
} from '../src/index.js';

describe('Logging', () => {
  it('lazily creates and caches the default logger', () => {
    const logging = createLogging();

    expect(logging.getLogger()).toBe(logging.getLogger('system'));
  });

  it('supports configured named loggers', () => {
    const logging = createLogging({
      default: 'system',
      level: 'info',
      loggers: {
        audit: { level: 'warn' },
      },
    });

    expect(logging.getLogger('audit').level).toBe('warn');
    expect(logging.getLogger('audit').bindings()).toMatchObject({
      logger: 'audit',
    });
  });

  it('uses the top-level config for unconfigured logger names', () => {
    const logging = createLogging({ default: 'system', level: 'debug' });
    const request = logging.getLogger('request');

    expect(request.level).toBe('debug');
    expect(request.bindings()).toMatchObject({ logger: 'request' });
  });

  it('merges named logger bindings with the top-level defaults', () => {
    const logging = createLogging({
      base: { service: 'nocobase', environment: 'test' },
      loggers: {
        audit: { base: { module: 'audit' } },
      },
    });

    expect(logging.getLogger('audit').bindings()).toMatchObject({
      service: 'nocobase',
      environment: 'test',
      module: 'audit',
      logger: 'audit',
    });
  });

  it('resolves logger names in rolling file transports', async () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'nocobase-logging-'));
    const logging = createLogging({
      file: { directory },
      loggers: { request: { file: { name: 'request' } } },
    });

    try {
      logging.getLogger('request').info('request received');
      await logging.flush();

      await vi.waitFor(
        () => {
          expect(readdirSync(directory)).toEqual([
            expect.stringMatching(/^request\.\d{4}-\d{2}-\d{2}\.000000\.log$/),
          ]);
        },
        { timeout: 5_000 },
      );
    } finally {
      try {
        await logging.close();
        await logging.close();
      } finally {
        rmSync(directory, { recursive: true, force: true });
      }
    }
  });

  it('provides a silent fallback and closes instantiated loggers idempotently', async () => {
    const logging = createLogging(createSilentLoggingConfig());

    logging.getLogger().fatal('hidden');

    await expect(logging.flush()).resolves.toBeUndefined();
    await expect(logging.close()).resolves.toBeUndefined();
    await expect(logging.close()).resolves.toBeUndefined();
  });
});

describe('isLoggerLevel', () => {
  it('recognizes supported logger levels', () => {
    expect(isLoggerLevel('debug')).toBe(true);
    expect(isLoggerLevel('verbose')).toBe(false);
  });
});

it('routes named loggers to separate directories', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'logging-directories-'));
  const logging = createLogging({
    file: { directory: path.join(root, 'app'), name: 'app' },
    console: { enabled: false },
    loggers: {
      request: {
        file: { directory: path.join(root, 'request'), name: 'request' },
      },
    },
  });
  try {
    logging.getLogger('system').info('application');
    logging.getLogger('request').info('request');
    await logging.close();
    expect(readdirSync(path.join(root, 'app'))).toEqual([
      expect.stringMatching(/^app\./),
    ]);
    expect(readdirSync(path.join(root, 'request'))).toEqual([
      expect.stringMatching(/^request\./),
    ]);
  } finally {
    await logging.close();
    rmSync(root, { recursive: true, force: true });
  }
});
