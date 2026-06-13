/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  commandOutput: vi.fn(),
  resolveProjectCwd: vi.fn((cwd?: string) => cwd ?? '/repo'),
  run: vi.fn(),
  runNocoBaseCommand: vi.fn(),
  resolveRegistryInfo: vi.fn(),
  readFile: vi.fn(),
}));

vi.mock('../lib/run-npm.js', () => ({
  commandOutput: mocks.commandOutput,
  resolveProjectCwd: mocks.resolveProjectCwd,
  run: mocks.run,
  runNocoBaseCommand: mocks.runNocoBaseCommand,
}));

vi.mock('../lib/source-registry.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/source-registry.js')>();
  return {
    ...actual,
    resolveSourceRegistryInfo: mocks.resolveRegistryInfo,
  };
});

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    readFile: mocks.readFile,
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.resolveRegistryInfo.mockResolvedValue({
    containerName: 'nb-source-registry',
    image: 'verdaccio/verdaccio',
    host: '127.0.0.1',
    port: 4873,
    url: 'http://127.0.0.1:4873',
    rootDir: '/tmp/nb-home/.nocobase/verdaccio',
    configPath: '/tmp/nb-home/.nocobase/verdaccio/config.yaml',
    storageDir: '/tmp/nb-home/.nocobase/verdaccio/storage',
    status: 'running',
  });
  mocks.commandOutput.mockImplementation(async (_command: string, args: string[]) => {
    if (args[0] === 'branch' && args[1] === '--show-current') {
      return 'main';
    }
    if (args[0] === 'rev-parse' && args[1] === '--short') {
      return 'abc12345';
    }
    if (args[0] === 'status') {
      return ' M packages/core/cli/src/lib/source-publish.ts';
    }
    if (args[0] === 'rev-parse' && args[1] === '--verify' && args[2] === 'refs/stash') {
      return 'stashsha123';
    }
    if (args[0] === 'stash' && args[1] === 'list') {
      return 'stash@{0}\x00stashsha123';
    }
    return 'abc12345';
  });
  mocks.readFile.mockResolvedValue(JSON.stringify({ version: '2.1.0-beta.34' }));
  mocks.run.mockResolvedValue(undefined);
  mocks.runNocoBaseCommand.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

test('resolveSourcePublishRegistry falls back to the running local source registry', async () => {
  const { resolveSourcePublishRegistry } = await import('../lib/source-publish.js');

  const registry = await resolveSourcePublishRegistry(undefined);

  expect(registry).toBe('http://127.0.0.1:4873');
});

test('buildSnapshotVersion uses date and git sha to form a unique version', async () => {
  const { buildSnapshotVersion, buildSuggestedInitCommand } = await import('../lib/source-publish.js');

  expect(buildSnapshotVersion('2.1.0-beta.34', 'abc12345', new Date('2026-05-19T08:00:00Z'))).toBe(
    '2.1.0-beta.34-snapshot.20260519.abc12345',
  );
  expect(
    buildSnapshotVersion(
      '2.1.0-beta.44-snapshot.20260607.b7e1284f-snapshot.20260607.bc696023',
      'bc696023',
      new Date('2026-06-07T10:03:52Z'),
    ),
  ).toBe('2.1.0-beta.44-snapshot.20260607.bc696023');
  expect(
    buildSuggestedInitCommand({
      version: '2.1.0-beta.34-snapshot.20260519.abc12345',
      npmRegistry: 'http://127.0.0.1:4873',
      gitSha: 'abc12345',
    }),
  ).toBe(
    'nb init --ui --env snapshotabc12345 --yes --source npm --version 2.1.0-beta.34-snapshot.20260519.abc12345 --npm-registry=http://127.0.0.1:4873',
  );
});

test('resolveGitBranch rejects a missing current branch reference before publishing', async () => {
  const { resolveGitBranch } = await import('../lib/source-publish.js');
  mocks.commandOutput.mockImplementation(async (_command: string, args: string[]) => {
    if (args[0] === 'branch' && args[1] === '--show-current') {
      return 'nb/source-publish-20260607100306-b7e1284f';
    }
    if (args[0] === 'rev-parse' && args[1] === '--verify' && args[2] === 'refs/heads/nb/source-publish-20260607100306-b7e1284f') {
      throw new Error('fatal: invalid reference: nb/source-publish-20260607100306-b7e1284f');
    }
    return 'abc12345';
  });

  await expect(resolveGitBranch('/repo')).rejects.toThrow(
    [
      'The current Git branch reference is invalid: nb/source-publish-20260607100306-b7e1284f.',
      'This usually means a previous source publish cleanup left HEAD pointing at a missing temporary branch.',
      'Switch to a real local branch, then run `nb source publish --snapshot` again.',
    ].join('\n'),
  );
});

test('publishSourceSnapshot versions and publishes from a temporary git branch', async () => {
  const { publishSourceSnapshot } = await import('../lib/source-publish.js');

  const result = await publishSourceSnapshot({
    npmRegistry: 'http://127.0.0.1:4873',
    now: new Date('2026-05-19T08:00:00'),
  });

  expect(result.version).toBe('2.1.0-beta.34-snapshot.20260519.abc12345');
  expect(result.npmRegistry).toBe('http://127.0.0.1:4873');
  expect(result.projectRoot).toBe('/repo');
  expect(mocks.run.mock.calls).toEqual([
    [
      'git',
      ['stash', 'push', '-u', '-m', 'nb/source-publish-20260519080000-abc12345'],
      { cwd: '/repo', errorName: 'git stash push', env: undefined, stdio: 'ignore' },
    ],
    [
      'git',
      ['switch', '-c', 'nb/source-publish-20260519080000-abc12345'],
      { cwd: '/repo', errorName: 'git switch', env: undefined, stdio: 'ignore' },
    ],
    [
      'git',
      ['stash', 'apply', '--index', 'stash@{0}'],
      { cwd: '/repo', errorName: 'git stash apply', env: undefined, stdio: 'ignore' },
    ],
    [
      'yarn',
      [
        'lerna',
        'version',
        '2.1.0-beta.34-snapshot.20260519.abc12345',
        '--force-publish=*',
        '--no-git-tag-version',
        '-y',
      ],
      { cwd: '/repo', errorName: 'lerna version', stdio: 'ignore' },
    ],
    ['git', ['add', '-A'], { cwd: '/repo', errorName: 'git add', env: undefined, stdio: 'ignore' }],
    [
      'git',
      ['commit', '--no-verify', '-m', 'chore(source-publish): 2.1.0-beta.34-snapshot.20260519.abc12345'],
      { cwd: '/repo', errorName: 'git commit', env: undefined, stdio: 'ignore' },
    ],
    [
      'yarn',
      [
        'lerna',
        'publish',
        'from-package',
        '--registry',
        'http://127.0.0.1:4873',
        '--dist-tag',
        'local',
        '--yes',
        '--no-verify-access',
        '--git-head',
        'abc12345',
      ],
      {
        cwd: '/repo',
        errorName: 'lerna publish',
        stdio: 'ignore',
        env: {
          npm_config_registry: 'http://127.0.0.1:4873',
        },
      },
    ],
    [
      'git',
      ['reset', '--hard', 'HEAD'],
      { cwd: '/repo', errorName: 'git reset --hard', env: undefined, stdio: 'ignore' },
    ],
    ['git', ['clean', '-fd'], { cwd: '/repo', errorName: 'git clean -fd', env: undefined, stdio: 'ignore' }],
    ['git', ['switch', 'main'], { cwd: '/repo', errorName: 'git switch', env: undefined, stdio: 'ignore' }],
    [
      'git',
      ['stash', 'pop', '--index', 'stash@{0}'],
      { cwd: '/repo', errorName: 'git stash pop', env: undefined, stdio: 'ignore' },
    ],
    [
      'git',
      ['branch', '-D', 'nb/source-publish-20260519080000-abc12345'],
      { cwd: '/repo', errorName: 'git branch -D', env: undefined, stdio: 'ignore' },
    ],
  ]);
  expect(mocks.runNocoBaseCommand).toHaveBeenCalledWith(['build'], {
    cwd: '/repo',
    stdio: 'ignore',
  });
});

test('publishSourceSnapshot skips stash steps when the worktree is already clean', async () => {
  const { publishSourceSnapshot } = await import('../lib/source-publish.js');
  mocks.commandOutput.mockImplementation(async (_command: string, args: string[]) => {
    if (args[0] === 'branch' && args[1] === '--show-current') {
      return 'main';
    }
    if (args[0] === 'rev-parse' && args[1] === '--short') {
      return 'abc12345';
    }
    if (args[0] === 'status') {
      return '';
    }
    return 'abc12345';
  });

  await publishSourceSnapshot({
    npmRegistry: 'http://127.0.0.1:4873',
    now: new Date('2026-05-19T08:00:00'),
  });

  expect(mocks.run.mock.calls).toEqual([
    [
      'git',
      ['switch', '-c', 'nb/source-publish-20260519080000-abc12345'],
      { cwd: '/repo', errorName: 'git switch', env: undefined, stdio: 'ignore' },
    ],
    [
      'yarn',
      [
        'lerna',
        'version',
        '2.1.0-beta.34-snapshot.20260519.abc12345',
        '--force-publish=*',
        '--no-git-tag-version',
        '-y',
      ],
      { cwd: '/repo', errorName: 'lerna version', stdio: 'ignore' },
    ],
    ['git', ['add', '-A'], { cwd: '/repo', errorName: 'git add', env: undefined, stdio: 'ignore' }],
    [
      'git',
      ['commit', '--no-verify', '-m', 'chore(source-publish): 2.1.0-beta.34-snapshot.20260519.abc12345'],
      { cwd: '/repo', errorName: 'git commit', env: undefined, stdio: 'ignore' },
    ],
    [
      'yarn',
      [
        'lerna',
        'publish',
        'from-package',
        '--registry',
        'http://127.0.0.1:4873',
        '--dist-tag',
        'local',
        '--yes',
        '--no-verify-access',
        '--git-head',
        'abc12345',
      ],
      {
        cwd: '/repo',
        errorName: 'lerna publish',
        stdio: 'ignore',
        env: {
          npm_config_registry: 'http://127.0.0.1:4873',
        },
      },
    ],
    [
      'git',
      ['reset', '--hard', 'HEAD'],
      { cwd: '/repo', errorName: 'git reset --hard', env: undefined, stdio: 'ignore' },
    ],
    ['git', ['clean', '-fd'], { cwd: '/repo', errorName: 'git clean -fd', env: undefined, stdio: 'ignore' }],
    ['git', ['switch', 'main'], { cwd: '/repo', errorName: 'git switch', env: undefined, stdio: 'ignore' }],
    [
      'git',
      ['branch', '-D', 'nb/source-publish-20260519080000-abc12345'],
      { cwd: '/repo', errorName: 'git branch -D', env: undefined, stdio: 'ignore' },
    ],
  ]);
  expect(mocks.runNocoBaseCommand).toHaveBeenCalledWith(['build'], {
    cwd: '/repo',
    stdio: 'ignore',
  });
});

test('publishSourceSnapshot skips build when --no-build is requested', async () => {
  const { publishSourceSnapshot } = await import('../lib/source-publish.js');
  mocks.commandOutput.mockImplementation(async (_command: string, args: string[]) => {
    if (args[0] === 'branch' && args[1] === '--show-current') {
      return 'main';
    }
    if (args[0] === 'rev-parse' && args[1] === '--short') {
      return 'abc12345';
    }
    if (args[0] === 'status') {
      return '';
    }
    return 'abc12345';
  });

  await publishSourceSnapshot({
    npmRegistry: 'http://127.0.0.1:4873',
    build: false,
    now: new Date('2026-05-19T08:00:00'),
  });

  expect(mocks.runNocoBaseCommand).not.toHaveBeenCalled();
});

test('publishSourceSnapshot forwards --no-build-dts to the source build', async () => {
  const { publishSourceSnapshot } = await import('../lib/source-publish.js');
  mocks.commandOutput.mockImplementation(async (_command: string, args: string[]) => {
    if (args[0] === 'branch' && args[1] === '--show-current') {
      return 'main';
    }
    if (args[0] === 'rev-parse' && args[1] === '--short') {
      return 'abc12345';
    }
    if (args[0] === 'status') {
      return '';
    }
    return 'abc12345';
  });

  await publishSourceSnapshot({
    npmRegistry: 'http://127.0.0.1:4873',
    buildDts: false,
    now: new Date('2026-05-19T08:00:00'),
  });

  expect(mocks.runNocoBaseCommand).toHaveBeenCalledWith(['build', '--no-dts'], {
    cwd: '/repo',
    stdio: 'ignore',
  });
});
