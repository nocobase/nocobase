// @vitest-environment node
import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, expect, it } from 'vitest';

import {
  buildNodeOptions,
  resolveBuildWorkspacePackages,
} from '../../src/tools/scripts/utils/build-workspace.mjs';

const directories: string[] = [];
afterEach(() => {
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

it('builds root runtime and client packages in order without building dependency test applications', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'build-workspace-'));
  directories.push(root);
  writeFileSync(
    path.join(root, 'pnpm-workspace.yaml'),
    "packages: ['packages/*']\nverifyDepsBeforeRun: false\n",
  );
  writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({
      name: '@fixture/app',
      dependencies: { '@fixture/plugin': 'workspace:*' },
      devDependencies: { '@fixture/client': 'workspace:*' },
      scripts: { build: 'node -e "process.exit(42)"' },
    }),
  );
  for (const [
    name,
    dependencies,
    devDependencies,
    peerDependencies,
    optionalDependencies,
  ] of [
    [
      'plugin',
      { '@fixture/shared': 'workspace:*' },
      { '@fixture/examples': 'workspace:*' },
      { '@fixture/peer': 'workspace:*' },
      { '@fixture/optional': 'workspace:*' },
    ],
    ['client', { '@fixture/shared': 'workspace:*' }],
    ['shared', { '@fixture/plugin': 'workspace:*' }],
    ['peer'],
    ['optional'],
    ['examples'],
    ['unrelated'],
  ] as const) {
    const directory = path.join(root, 'packages', name);
    mkdirSync(directory, { recursive: true });
    writeFileSync(
      path.join(directory, 'package.json'),
      JSON.stringify({
        name: `@fixture/${name}`,
        dependencies,
        devDependencies,
        peerDependencies,
        optionalDependencies,
        scripts: { build: `node build.cjs` },
      }),
    );
    writeFileSync(
      path.join(directory, 'build.cjs'),
      `require('node:fs').appendFileSync(${JSON.stringify(path.join(root, 'built.txt'))}, ${JSON.stringify(`${name}\n`)});`,
    );
  }
  // Cycles terminate, the root is excluded, and all runtime edge kinds remain reachable.
  expect(resolveBuildWorkspacePackages(root)).toEqual([
    '@fixture/client',
    '@fixture/optional',
    '@fixture/peer',
    '@fixture/plugin',
    '@fixture/shared',
  ]);
  // Remove the cycle before asking pnpm to topologically order this fixture.
  writeFileSync(
    path.join(root, 'packages/shared/package.json'),
    JSON.stringify({
      name: '@fixture/shared',
      scripts: { build: 'node build.cjs' },
    }),
  );
  execFileSync(
    'pnpm',
    [
      '-r',
      '--workspace-concurrency=2',
      ...resolveBuildWorkspacePackages(root).flatMap((name: string) => [
        '--filter',
        name,
      ]),
      '--if-present',
      'build',
    ],
    { cwd: root, env: { ...process.env, CI: 'true' } },
  );
  const built = readFileSync(path.join(root, 'built.txt'), 'utf8')
    .trim()
    .split('\n');
  expect(built.sort()).toEqual([
    'client',
    'optional',
    'peer',
    'plugin',
    'shared',
  ]);
  const order = readFileSync(path.join(root, 'built.txt'), 'utf8')
    .trim()
    .split('\n');
  expect(order.indexOf('shared')).toBeLessThan(order.indexOf('client'));
  expect(order.indexOf('shared')).toBeLessThan(order.indexOf('plugin'));
});

it('sets a default compiler heap while preserving caller Node options and explicit limits', () => {
  expect(buildNodeOptions()).toBe('--max-old-space-size=6144');
  expect(buildNodeOptions('--enable-source-maps')).toBe(
    '--enable-source-maps --max-old-space-size=6144',
  );
  for (const option of [
    '--max-old-space-size=4096',
    '--max_old_space_size=8192',
    '--max-old-space-size 2048',
  ]) {
    expect(buildNodeOptions(option)).toBe(option);
  }
});
