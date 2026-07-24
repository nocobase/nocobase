/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, expect, it, vi } from 'vitest';

import { runTypeScriptEnvironmentGeneratorCli } from '../../../scripts/generate-typescript-environment';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => fs.rm(directory, { recursive: true, force: true })),
  );
});

it('generates a stable TypeScript environment artifact and detects stale output', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'runjs-typescript-environment-'));
  temporaryDirectories.push(directory);
  const outputPath = path.join(directory, 'runJSTypeScriptEnvironmentFiles.ts');
  const io = { error: vi.fn(), log: vi.fn() };

  expect(await runTypeScriptEnvironmentGeneratorCli([], { outputPath, io })).toBe(0);
  const first = await fs.readFile(outputPath, 'utf8');
  expect(await runTypeScriptEnvironmentGeneratorCli([], { outputPath, io })).toBe(0);
  expect(await fs.readFile(outputPath, 'utf8')).toBe(first);
  expect(await runTypeScriptEnvironmentGeneratorCli(['--check'], { outputPath, io })).toBe(0);
  expect(first).toContain('runJSTypeScriptEnvironmentPack');
  expect(first).toContain('path": "/__runjs__/lib.es2020.d.ts');
  expect(first).toContain('path": "/__runjs__/lib.dom.d.ts');
  expect(first).toContain('path": "/__runjs__/browser-globals.d.ts');
  expect(first).toContain('contentHash');
  expect(first).not.toContain('/// <reference');

  await fs.writeFile(outputPath, `${first}\n// stale\n`, 'utf8');
  expect(await runTypeScriptEnvironmentGeneratorCli(['--check'], { outputPath, io })).toBe(1);
  expect(io.error).toHaveBeenCalledWith(expect.stringContaining('out of date'));
});
