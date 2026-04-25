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
import { resolveProjectCwd, run } from '../lib/run-npm.js';

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

afterEach(() => {
  vi.unstubAllGlobals();
});

test('resolveProjectCwd walks up parent directories to find a NocoBase project root', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-project-'));
  const projectRoot = path.join(dir, 'app2', 'source');
  const nestedCwd = path.join(projectRoot, 'packages', 'core', 'cli');
  const marker = path.join(projectRoot, 'node_modules', '.bin', 'nocobase-v1');

  try {
    await fsp.mkdir(path.dirname(marker), { recursive: true });
    await fsp.mkdir(nestedCwd, { recursive: true });
    await fsp.writeFile(marker, '');

    vi.stubGlobal('process', {
      ...process,
      cwd: vi.fn(() => nestedCwd),
    });

    expect(resolveProjectCwd('./app2/source')).toBe(projectRoot);
    expect(resolveProjectCwd('')).toBe(nestedCwd);
    expect(resolveProjectCwd('   ')).toBe(nestedCwd);
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});
