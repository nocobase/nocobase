/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { setCliConfigValue } from '../lib/cli-config.js';
import {
  finalizeCommandLogSessionSync,
  getCommandLogCommandId,
  initCommandLogSession,
  installCommandLogWriteHooks,
  sanitizeArgv,
  stripAnsi,
} from '../lib/command-log.js';

afterEach(() => {
  delete process.env.NB_CLI_ACTIVE_LOG_FILE;
  delete process.env.NB_CLI_ACTIVE_META_FILE;
  delete process.env.NB_CLI_LOG_DIR;
  delete process.env.NB_CLI_LOG_DISABLED;
});

test('getCommandLogCommandId derives stable command ids for common commands', () => {
  expect(getCommandLogCommandId(['app', 'start', '--env', 'dev'])).toBe('app-start');
  expect(getCommandLogCommandId(['api', 'resource', 'list', '--env', 'dev'])).toBe('api-resource-list');
  expect(getCommandLogCommandId(['plugin', 'enable', '@nocobase/plugin-demo'])).toBe('plugin-enable');
});

test('stripAnsi removes terminal control sequences', () => {
  expect(stripAnsi('\u001B[31merror\u001B[39m')).toBe('error');
});

test('sanitizeArgv redacts short and long token flags', () => {
  expect(sanitizeArgv(['api', 'users', 'list', '-t', 'short-secret'])).toEqual(['api', 'users', 'list', '-t', '***']);
  expect(sanitizeArgv(['api', 'users', 'list', '-t=inline-secret'])).toEqual(['api', 'users', 'list', '-t=***']);
  expect(sanitizeArgv(['api', 'users', 'list', '-tcompact-secret'])).toEqual(['api', 'users', 'list', '-t***']);
  expect(sanitizeArgv(['api', 'users', 'list', '--token=long-secret'])).toEqual([
    'api',
    'users',
    'list',
    '--token=***',
  ]);
});

test('command log session writes log and meta files and captures stdout/stderr', async () => {
  const logRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-command-log-'));
  process.env.NB_CLI_LOG_DIR = logRoot;

  try {
    const session = await initCommandLogSession({
      argv: ['app', 'start', '--access-token', 'secret'],
      cwd: '/tmp/workspace',
      sessionId: 'nb-session-1',
      cliVersion: '2.1.0-beta.44',
      nodeVersion: process.version,
      platform: process.platform,
      interactive: false,
      verbose: false,
      startedAt: new Date('2026-06-07T15:15:00.000Z'),
    });

    expect(session).toBeDefined();
    if (!session) {
      throw new Error('expected command log session to be created');
    }
    const restore = installCommandLogWriteHooks();

    process.stdout.write('\u001B[32mhello stdout\u001B[39m\n');
    process.stderr.write('hello stderr\n');

    restore?.();
    finalizeCommandLogSessionSync(session, {
      exitCode: 0,
      endedAt: new Date('2026-06-07T15:15:02.500Z'),
    });

    expect(session.logFile).toContain(`${path.sep}2026-06-07${path.sep}nb-session-1${path.sep}`);
    expect(session.metaFile).toContain(`${path.sep}2026-06-07${path.sep}nb-session-1${path.sep}`);
    const logContent = await fsp.readFile(session.logFile, 'utf8');
    const metaContent = JSON.parse(await fsp.readFile(session.metaFile, 'utf8'));

    expect(logContent).toBe('hello stdout\nhello stderr\n');
    expect(metaContent.argv).toEqual(['app', 'start', '--access-token', '***']);
    expect(metaContent.sessionId).toBe('nb-session-1');
    expect(metaContent.exitCode).toBe(0);
    expect(metaContent.durationMs).toBe(2500);
    expect(metaContent.verbose).toBe(false);
  } finally {
    await fsp.rm(logRoot, { recursive: true, force: true });
  }
});

test('command log initialization cleans up dated directories older than configured retention days', async () => {
  const logRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-command-log-cleanup-'));
  const cliRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-command-log-config-'));
  const previousCliRoot = process.env.NB_CLI_ROOT;
  const now = new Date();
  const oldDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  oldDate.setUTCDate(oldDate.getUTCDate() - 20);
  const keepDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  keepDate.setUTCDate(keepDate.getUTCDate() - 13);
  const formatDateDir = (date: Date) => {
    const year = String(date.getFullYear());
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const oldDirName = formatDateDir(oldDate);
  const keepDirName = formatDateDir(keepDate);
  process.env.NB_CLI_LOG_DIR = logRoot;
  process.env.NB_CLI_ROOT = cliRoot;

  try {
    await setCliConfigValue('log.retention-days', '14', { scope: 'global' });
    await fsp.mkdir(path.join(logRoot, oldDirName), { recursive: true });
    await fsp.writeFile(path.join(logRoot, oldDirName, 'old.log'), 'old', 'utf8');
    await fsp.mkdir(path.join(logRoot, keepDirName), { recursive: true });
    await fsp.writeFile(path.join(logRoot, keepDirName, 'keep.log'), 'keep', 'utf8');
    await fsp.mkdir(path.join(logRoot, 'misc-folder'), { recursive: true });

    const session = await initCommandLogSession({
      argv: ['app', 'start'],
      cwd: '/tmp/workspace',
      startedAt: now,
    });

    expect(session).toBeDefined();
    if (!session) {
      throw new Error('expected command log session to be created');
    }
    expect(await fsp.stat(path.join(logRoot, keepDirName))).toBeDefined();
    await expect(fsp.stat(path.join(logRoot, oldDirName))).rejects.toThrow();
    expect(await fsp.stat(path.join(logRoot, 'misc-folder'))).toBeDefined();
    expect(session.logFile).toContain(`${path.sep}${formatDateDir(now)}${path.sep}`);
  } finally {
    if (previousCliRoot === undefined) {
      delete process.env.NB_CLI_ROOT;
    } else {
      process.env.NB_CLI_ROOT = previousCliRoot;
    }
    await fsp.rm(logRoot, { recursive: true, force: true });
    await fsp.rm(cliRoot, { recursive: true, force: true });
  }
});

test('command log initialization is disabled by config log.enabled=false', async () => {
  const logRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-command-log-disabled-'));
  const cliRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-command-log-disabled-config-'));
  const previousCliRoot = process.env.NB_CLI_ROOT;
  process.env.NB_CLI_LOG_DIR = logRoot;
  process.env.NB_CLI_ROOT = cliRoot;

  try {
    await setCliConfigValue('log.enabled', 'false', { scope: 'global' });

    const session = await initCommandLogSession({
      argv: ['app', 'start'],
      cwd: '/tmp/workspace',
    });

    expect(session).toBeUndefined();
    expect(await fsp.readdir(logRoot)).toEqual([]);
  } finally {
    if (previousCliRoot === undefined) {
      delete process.env.NB_CLI_ROOT;
    } else {
      process.env.NB_CLI_ROOT = previousCliRoot;
    }
    await fsp.rm(logRoot, { recursive: true, force: true });
    await fsp.rm(cliRoot, { recursive: true, force: true });
  }
});

test('command log initialization is disabled by NB_CLI_LOG_DISABLED even when config enables logs', async () => {
  const logRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-command-log-env-disabled-'));
  const cliRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-command-log-env-disabled-config-'));
  const previousCliRoot = process.env.NB_CLI_ROOT;
  const previousDisabled = process.env.NB_CLI_LOG_DISABLED;
  process.env.NB_CLI_LOG_DIR = logRoot;
  process.env.NB_CLI_ROOT = cliRoot;
  process.env.NB_CLI_LOG_DISABLED = '1';

  try {
    await setCliConfigValue('log.enabled', 'true', { scope: 'global' });

    const session = await initCommandLogSession({
      argv: ['app', 'start'],
      cwd: '/tmp/workspace',
    });

    expect(session).toBeUndefined();
    expect(await fsp.readdir(logRoot)).toEqual([]);
  } finally {
    if (previousDisabled === undefined) {
      delete process.env.NB_CLI_LOG_DISABLED;
    } else {
      process.env.NB_CLI_LOG_DISABLED = previousDisabled;
    }
    if (previousCliRoot === undefined) {
      delete process.env.NB_CLI_ROOT;
    } else {
      process.env.NB_CLI_ROOT = previousCliRoot;
    }
    await fsp.rm(logRoot, { recursive: true, force: true });
    await fsp.rm(cliRoot, { recursive: true, force: true });
  }
});
