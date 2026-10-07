// @vitest-environment node

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  findWorkspaceRoot,
  listWorkspacePackages,
} from '../../src/tools/scripts/utils/workspace-packages.mjs';

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function createDirectory(): string {
  const directory = mkdtempSync(
    path.join(os.tmpdir(), 'nocobase-workspace-packages-'),
  );
  temporaryDirectories.push(directory);
  return directory;
}

function writePackage(directory: string, name: string): string {
  mkdirSync(directory, { recursive: true });
  writeFileSync(path.join(directory, 'package.json'), JSON.stringify({ name }));
  return directory;
}

/** A monorepo whose product application sits at the repository root, beside `packages/`. */
function createMonorepo(patterns: readonly string[]): string {
  const root = createDirectory();
  writeFileSync(
    path.join(root, 'pnpm-workspace.yaml'),
    `packages:\n${patterns.map((pattern) => `  - '${pattern}'`).join('\n')}\n`,
  );
  writePackage(path.join(root, 'acme'), 'acme');
  writePackage(
    path.join(root, 'packages', 'plugins', 'plugin-demo'),
    '@fixture/plugin-demo',
  );
  writePackage(path.join(root, 'packages', 'templates', 'app'), '@fixture/app');
  writePackage(
    path.join(
      root,
      'packages',
      'plugins',
      'plugin-demo',
      'node_modules',
      'dep',
    ),
    'dep',
  );
  return root;
}

describe('listWorkspacePackages', () => {
  it('reads the workspace declaration, so an application at the repository root finds the packages under packages/', () => {
    const root = createMonorepo(['packages/*/*', 'acme']);

    expect(listWorkspacePackages(path.join(root, 'acme'))).toEqual(
      new Map([
        ['acme', path.join(root, 'acme')],
        [
          '@fixture/plugin-demo',
          path.join(root, 'packages', 'plugins', 'plugin-demo'),
        ],
        ['@fixture/app', path.join(root, 'packages', 'templates', 'app')],
      ]),
    );
  });

  it('gives an application under packages/ the same neighbours', () => {
    const root = createMonorepo(['packages/*/*', 'acme']);

    expect(
      [
        ...listWorkspacePackages(
          path.join(root, 'packages', 'templates', 'app'),
        ).keys(),
      ].sort(),
    ).toEqual(['@fixture/app', '@fixture/plugin-demo', 'acme']);
  });

  it("applies the declaration's exclusions", () => {
    const root = createMonorepo([
      'packages/*/*',
      'acme',
      '!packages/templates/*',
    ]);

    expect(
      [...listWorkspacePackages(path.join(root, 'acme')).keys()].sort(),
    ).toEqual(['@fixture/plugin-demo', 'acme']);
  });

  it('keeps scanning beside a generated application whose own pnpm-workspace.yaml declares no packages', () => {
    const parent = createDirectory();
    const app = writePackage(path.join(parent, 'crm'), 'crm');
    writeFileSync(
      path.join(app, 'pnpm-workspace.yaml'),
      'allowBuilds:\n  esbuild: true\n',
    );
    writePackage(path.join(parent, 'plugin-local'), '@fixture/plugin-local');

    expect(findWorkspaceRoot(app)).toBe(app);
    expect([...listWorkspacePackages(app).keys()].sort()).toEqual([
      '@fixture/plugin-local',
      'crm',
    ]);
  });
});
