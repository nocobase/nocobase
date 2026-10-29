// @vitest-environment node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, expect, it } from 'vitest';

import { resolveWorkspaceWatchIncludes } from '../../src/tools/scripts/dev/workspace-watches.mjs';

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0))
    fs.rmSync(root, { recursive: true, force: true });
});

it('watches reachable internal packages, including client dependencies and cycles, but excludes unrelated packages', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dev-workspace-'));
  roots.push(root);
  const writePackage = (directory: string, manifest: object) => {
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(
      path.join(directory, 'package.json'),
      JSON.stringify(manifest),
    );
  };
  fs.writeFileSync(
    path.join(root, 'pnpm-workspace.yaml'),
    "packages: ['packages/*']\n",
  );
  writePackage(root, {
    name: 'app',
    dependencies: { '@app/service': 'workspace:*', '@app/registry': '^1.0.0' },
    devDependencies: { '@app/ui': 'workspace:*' },
  });
  writePackage(path.join(root, 'packages/service'), {
    name: '@app/service',
    dependencies: { '@app/shared': 'workspace:*' },
    devDependencies: { '@app/build-only': 'workspace:*' },
  });
  writePackage(path.join(root, 'packages/shared'), {
    name: '@app/shared',
    dependencies: { '@app/service': 'workspace:*' },
  });
  for (const name of ['ui', 'unused', 'build-only', 'registry']) {
    writePackage(path.join(root, 'packages', name), { name: `@app/${name}` });
  }
  const includes = resolveWorkspaceWatchIncludes(root);
  expect(
    includes.filter((entry: string) => entry.endsWith('/package.json')).sort(),
  ).toEqual([
    'packages/service/package.json',
    'packages/shared/package.json',
    'packages/ui/package.json',
  ]);
  expect(includes).toContain('packages/shared/src/**/*');
  expect(includes).toContain('packages/shared/dist/**/*');
  expect(includes).toHaveLength(new Set(includes).size);
});

it('does no workspace discovery when the application has no internal packages', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dev-workspace-'));
  roots.push(root);
  expect(resolveWorkspaceWatchIncludes(root)).toEqual([]);
});
