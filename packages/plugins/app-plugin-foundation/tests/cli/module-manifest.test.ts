import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { bindAppCommand, runAppCommand } from '@nocobase/app-testing/cli';
import { afterEach, expect, it } from 'vitest';
import cliPlugin from '../../cli/index.js';
import BuildModuleManifest from '../../cli/module-manifest.js';
import { collectModuleSources } from '../../server/module-sources.js';

let root: string | undefined;
afterEach(async () => {
  if (root) await rm(root, { recursive: true, force: true });
});

it('runs the build command without an App or database and preserves only reachable evidence in a source-free deployment', async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'foundation-build-'));
  await mkdir(path.join(root, 'client'), { recursive: true });
  await writeFile(
    path.join(root, 'package.json'),
    JSON.stringify({ name: 'fixture-app' }),
  );
  await writeFile(
    path.join(root, 'client/routes.ts'),
    `export default [{name:'files',componentLoader:()=>import('./page.js')}];`,
  );
  await writeFile(
    path.join(root, 'client/page.ts'),
    `import {FileList} from '@nocobase/app-plugin-file/client'; import {Unused} from '@nocobase/app-plugin-knowledge/client'; export default ()=>FileList();`,
  );
  const command = bindAppCommand(BuildModuleManifest, {
    rootDir: root,
    id: 'foundation:modules:build',
  });
  const first = await runAppCommand(command, ['--json']);
  expect(first.json()).toMatchObject({
    ok: true,
    result: { routes: 1, complete: true },
  });
  const artifact = path.join(root, 'dist/server/foundation-modules.json');
  const contents = await readFile(artifact, 'utf8');
  const before = (await stat(artifact)).mtimeMs;
  await runAppCommand(command, ['--json']);
  expect((await stat(artifact)).mtimeMs).toBe(before);
  expect(await readFile(artifact, 'utf8')).toBe(contents);
  expect(contents).not.toContain(root);
  expect(contents).not.toContain('FileList');
  expect(contents).not.toContain('@nocobase/app-plugin-knowledge');
  await writeFile(
    path.join(root, 'dist/package.json'),
    JSON.stringify({ name: 'fixture-app' }),
  );
  await rm(path.join(root, 'client'), { recursive: true });
  const built = await collectModuleSources(path.join(root, 'dist'));
  expect(built).toMatchObject({
    complete: true,
    routes: [
      {
        packageName: 'fixture-app',
        routeName: 'files',
        providers: ['@nocobase/app-plugin-file'],
        complete: true,
      },
    ],
  });
  const manifest = JSON.parse(contents) as { packageName: string };
  manifest.packageName = 'another-app';
  await writeFile(artifact, JSON.stringify(manifest));
  expect(await collectModuleSources(path.join(root, 'dist'))).toEqual({
    routes: [],
    complete: false,
  });
});

it('declares an automatic after-server-build hook using the plugin-owned command', () => {
  expect(cliPlugin.buildHooks.afterServerBuild).toEqual([
    {
      label: 'Collect Foundation module associations',
      command: ['pnpm', 'nocobase', 'foundation', 'modules', 'build'],
    },
  ]);
});
