/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'node:path';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  commandSucceeds: vi.fn(),
  commandOutput: vi.fn(),
  run: vi.fn(),
  resolveCwd: vi.fn((value?: string) => value ?? process.cwd()),
  resolveProjectCwd: vi.fn((cwd?: string) => cwd ?? '/repo'),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}));

vi.mock('../lib/run-npm.js', () => ({
  commandSucceeds: mocks.commandSucceeds,
  commandOutput: mocks.commandOutput,
  run: mocks.run,
  resolveCwd: mocks.resolveCwd,
  resolveProjectCwd: mocks.resolveProjectCwd,
}));

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  const mockedModule = {
    ...actual,
    readFile: mocks.readFile,
    writeFile: mocks.writeFile,
    mkdir: mocks.mkdir,
  };
  return {
    ...mockedModule,
    default: mockedModule,
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NB_CLI_ROOT = '/tmp/nb-home';
  mocks.readFile.mockResolvedValue('');
  mocks.writeFile.mockResolvedValue(undefined);
  mocks.mkdir.mockResolvedValue(undefined);
});

afterEach(() => {
  delete process.env.NB_CLI_ROOT;
});

test('resolveSourceRegistryInfo reports missing when the container does not exist', async () => {
  const { resolveSourceRegistryInfo } = await import('../lib/source-registry.js');
  mocks.commandSucceeds.mockResolvedValue(false);

  const info = await resolveSourceRegistryInfo();

  expect(info.status).toBe('missing');
  expect(info.url).toBe('http://127.0.0.1:4873');
  expect(info.configPath).toBe(path.join('/tmp/nb-home', '.nocobase', 'verdaccio', 'config.yaml'));
  expect(info.storageDir).toBe(path.join('/tmp/nb-home', '.nocobase', 'verdaccio', 'storage'));
});

test('resolveSourceRegistryInfo reports running when the container exists and is running', async () => {
  const { resolveSourceRegistryInfo } = await import('../lib/source-registry.js');
  mocks.commandSucceeds.mockResolvedValue(true);
  mocks.commandOutput.mockResolvedValue('true');

  const info = await resolveSourceRegistryInfo();

  expect(info.status).toBe('running');
  expect(mocks.commandOutput).toHaveBeenCalledWith(
    'docker',
    ['inspect', '--format', '{{.State.Running}}', 'nb-source-registry'],
    { errorName: 'docker inspect' },
  );
});

test('stopSourceRegistry returns already-stopped when the container is absent', async () => {
  const { stopSourceRegistry } = await import('../lib/source-registry.js');
  mocks.commandSucceeds.mockResolvedValue(false);

  const state = await stopSourceRegistry();

  expect(state).toBe('already-stopped');
  expect(mocks.run).not.toHaveBeenCalled();
});

test('ensureSourceRegistryFiles writes a template-based config with local publish overrides', async () => {
  const { ensureSourceRegistryFiles } = await import('../lib/source-registry.js');
  mocks.readFile.mockResolvedValue([
    'storage: ./storage',
    'auth:',
    '  htpasswd:',
    '    file: ./htpasswd',
    'packages:',
    "  '@*/*':",
    '    publish: $authenticated',
    '    unpublish: $authenticated',
    "  '**':",
    '    publish: $authenticated',
    '    unpublish: $authenticated',
    '',
  ].join('\n'));

  await ensureSourceRegistryFiles('/repo');

  expect(mocks.readFile).toHaveBeenCalledWith(path.join('/repo', 'config.yaml'), 'utf8');
  expect(mocks.writeFile).toHaveBeenCalledTimes(1);
  const [configPath, configContent, encoding] = mocks.writeFile.mock.calls[0];
  expect(configPath).toBe(path.join('/tmp/nb-home', '.nocobase', 'verdaccio', 'config.yaml'));
  expect(encoding).toBe('utf8');
  expect(configContent).toContain('storage: /verdaccio/storage');
  expect(configContent).toContain('file: /verdaccio/storage/htpasswd');
  expect(configContent).toContain("  '@*/*':\n    publish: $all\n    unpublish: $all");
  expect(configContent).toContain("  '**':\n    publish: $all\n    unpublish: $all");
});
