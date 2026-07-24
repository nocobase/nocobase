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
import { afterEach, expect, test, vi } from 'vitest';
import { commandOutput, commandOutputViaFile, resolveProjectCwd, run } from '../lib/run-npm.js';

test('run preserves arguments containing spaces', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-run-'));
  const script = path.join(dir, 'assert-argv.cjs');
  await fsp.writeFile(
    script,
    [
      "const assert = require('node:assert/strict');",
      "assert.equal(process.argv[2], 'INIT_ROOT_NICKNAME=Super Admin');",
    ].join('\n'),
  );

  try {
    await run(process.execPath, [script, 'INIT_ROOT_NICKNAME=Super Admin']);
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('commandOutputViaFile captures long stdout without truncation', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-output-file-'));
  const script = path.join(dir, 'print-long-json.cjs');
  const payload = Array.from({ length: 300 }, (_, index) => ({
    name: `skill-${index}`,
    value: 'x'.repeat(80),
  }));
  await fsp.writeFile(script, `process.stdout.write(${JSON.stringify(JSON.stringify(payload))});`);

  try {
    const output = await commandOutputViaFile(process.execPath, [script]);
    expect(JSON.parse(output)).toEqual(payload);
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('run rejects and terminates the child process when a timeout is reached', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-run-timeout-'));
  const script = path.join(dir, 'hang.cjs');
  await fsp.writeFile(script, 'setInterval(() => {}, 1000);');

  try {
    await expect(run(process.execPath, [script], { stdio: 'ignore', timeoutMs: 50 })).rejects.toThrow(
      `${process.execPath} timed out after 50ms`,
    );
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('commandOutput rejects when a timeout is reached', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-output-timeout-'));
  const script = path.join(dir, 'hang-output.cjs');
  await fsp.writeFile(script, 'setInterval(() => {}, 1000);');

  try {
    await expect(commandOutput(process.execPath, [script], { timeoutMs: 50 })).rejects.toThrow(
      `${process.execPath} timed out after 50ms`,
    );
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('commandOutputViaFile rejects when a timeout is reached', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-output-file-timeout-'));
  const script = path.join(dir, 'hang-output-file.cjs');
  await fsp.writeFile(script, 'setInterval(() => {}, 1000);');

  try {
    await expect(commandOutputViaFile(process.execPath, [script], { timeoutMs: 50 })).rejects.toThrow(
      `${process.execPath} timed out after 50ms`,
    );
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('run forwards piped stdout and stderr to callbacks', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-run-pipe-'));
  const script = path.join(dir, 'print-streams.cjs');
  await fsp.writeFile(
    script,
    ["process.stdout.write('hello stdout');", "process.stderr.write('hello stderr');"].join('\n'),
  );

  let stdout = '';
  let stderr = '';

  try {
    await run(process.execPath, [script], {
      stdio: 'pipe',
      onStdout: (chunk) => {
        stdout += chunk;
      },
      onStderr: (chunk) => {
        stderr += chunk;
      },
    });

    expect(stdout).toBe('hello stdout');
    expect(stderr).toBe('hello stderr');
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('run can replace the child process environment', async () => {
  vi.stubEnv('NOCOBASE_PARENT_ONLY', 'parent-value');
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-run-env-'));
  const script = path.join(dir, 'print-env.cjs');
  await fsp.writeFile(
    script,
    [
      'process.stdout.write(JSON.stringify({',
      '  childOnly: process.env.NOCOBASE_CHILD_ONLY,',
      '  parentOnly: process.env.NOCOBASE_PARENT_ONLY,',
      '  nodeOptions: process.env.NODE_OPTIONS,',
      '}));',
    ].join('\n'),
  );

  let stdout = '';

  try {
    await run(process.execPath, [script], {
      env: {
        NOCOBASE_CHILD_ONLY: 'child-value',
      },
      envMode: 'replace',
      stdio: 'pipe',
      onStdout: (chunk) => {
        stdout += chunk;
      },
    });

    expect(JSON.parse(stdout)).toEqual({
      childOnly: 'child-value',
    });
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

test('resolveProjectCwd walks up parent directories to find a NocoBase project root', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-project-'));
  const projectRoot = path.join(dir, 'app2', 'source');
  const nestedCwd = path.join(projectRoot, 'packages', 'core', 'cli');
  const marker = path.join(projectRoot, 'node_modules', '.bin', 'nocobase-v1');
  const relativeProjectPath = path.relative(nestedCwd, projectRoot);

  try {
    await fsp.mkdir(path.dirname(marker), { recursive: true });
    await fsp.mkdir(nestedCwd, { recursive: true });
    await fsp.writeFile(marker, '');

    vi.stubGlobal('process', {
      ...process,
      cwd: vi.fn(() => nestedCwd),
    });

    expect(resolveProjectCwd()).toBe(projectRoot);
    expect(resolveProjectCwd(relativeProjectPath)).toBe(projectRoot);
    expect(resolveProjectCwd(nestedCwd)).toBe(projectRoot);
    expect(resolveProjectCwd('')).toBe(projectRoot);
    expect(resolveProjectCwd('   ')).toBe(projectRoot);
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('resolveProjectCwd keeps an explicit relative cwd anchored to its resolved path', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-project-relative-'));
  const outsideCwd = path.join(dir, 'workspace');
  const projectRoot = path.join(dir, 'app2', 'source');
  const nestedCwd = path.join(projectRoot, 'packages', 'core', 'cli');
  const marker = path.join(projectRoot, 'node_modules', '.bin', 'nocobase-v1');
  const relativeNestedPath = path.relative(outsideCwd, nestedCwd);

  try {
    await fsp.mkdir(path.dirname(marker), { recursive: true });
    await fsp.mkdir(outsideCwd, { recursive: true });
    await fsp.mkdir(nestedCwd, { recursive: true });
    await fsp.writeFile(marker, '');

    vi.stubGlobal('process', {
      ...process,
      cwd: vi.fn(() => outsideCwd),
    });

    expect(resolveProjectCwd(relativeNestedPath)).toBe(projectRoot);
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('resolveProjectCwd explains when an explicit cwd does not exist', () => {
  expect(() => resolveProjectCwd('/tmp/nocobase-cli-missing-project-root')).toThrow(
    'The specified --cwd does not exist: /tmp/nocobase-cli-missing-project-root',
  );
});
