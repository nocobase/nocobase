import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import {
  resolveAppRoot,
  resolveWorkspaceApp,
} from '../src/lib/workspace-app.ts';

const created: string[] = [];

afterEach(async () => {
  await Promise.all(
    created
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

async function createWorkspace(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'nb3-workspace-'));
  created.push(root);
  await writePackage(
    path.join(root, 'packages', 'templates', 'app-template-default'),
    '@nocobase/app-template-default',
  );
  await writePackage(
    path.join(root, 'packages', 'examples', 'custom-app'),
    '@example/custom-app',
  );
  return root;
}

async function writePackage(root: string, name: string): Promise<void> {
  await mkdir(root, { recursive: true });
  await writeFile(path.join(root, 'package.json'), JSON.stringify({ name }));
}

describe('workspace app resolution', () => {
  it('defaults to app-template-default', async () => {
    const workspaceRoot = await createWorkspace();

    await expect(resolveAppRoot({ workspaceRoot })).resolves.toBe(
      path.join(workspaceRoot, 'packages', 'templates', 'app-template-default'),
    );
  });

  it('accepts a directory name or full package name', async () => {
    const workspaceRoot = await createWorkspace();

    await expect(
      resolveWorkspaceApp(workspaceRoot, 'custom-app'),
    ).resolves.toEqual({
      packageName: '@example/custom-app',
      root: path.join(workspaceRoot, 'packages', 'examples', 'custom-app'),
    });
    await expect(
      resolveWorkspaceApp(workspaceRoot, '@example/custom-app'),
    ).resolves.toEqual({
      packageName: '@example/custom-app',
      root: path.join(workspaceRoot, 'packages', 'examples', 'custom-app'),
    });
  });

  it('rejects conflicting directory and workspace modes', async () => {
    await expect(
      resolveAppRoot({ dir: '.', workspaceRoot: '.' }),
    ).rejects.toThrow('--dir and --workspace-root cannot be used together');
    await expect(resolveAppRoot({ app: 'demo' })).rejects.toThrow(
      '--app requires --workspace-root',
    );
  });

  it('finds an application the workspace declares outside packages/', async () => {
    const workspaceRoot = await createWorkspace();
    await writePackage(path.join(workspaceRoot, 'acme'), 'acme');
    await writeFile(
      path.join(workspaceRoot, 'pnpm-workspace.yaml'),
      "packages:\n  - 'packages/*/*'\n  - 'acme'\n",
    );

    await expect(resolveWorkspaceApp(workspaceRoot, 'acme')).resolves.toEqual({
      packageName: 'acme',
      root: path.join(workspaceRoot, 'acme'),
    });
    await expect(resolveAppRoot({ workspaceRoot })).resolves.toBe(
      path.join(workspaceRoot, 'packages', 'templates', 'app-template-default'),
    );
  });

  it('reports a missing app selector', async () => {
    const workspaceRoot = await createWorkspace();

    await expect(
      resolveWorkspaceApp(workspaceRoot, 'missing-app'),
    ).rejects.toThrow('Application package not found');
  });
});
