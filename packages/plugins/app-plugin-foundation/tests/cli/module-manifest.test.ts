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
import {
  overlapCases,
  withOverlapFixture,
} from '../helpers/overlapping-routes.js';
import cliPlugin from '../../cli/index.js';
import BuildModuleManifest from '../../cli/module-manifest.js';
import { collectModuleSources } from '../../server/module-sources.js';
import { writeModuleManifest } from '../../server/module-manifest.js';

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

it.each(['', 'dist/'])(
  'retains %s API dependencies and tuple-generated pages in a source-free deployment',
  async (prefix) => {
    root = await mkdtemp(path.join(os.tmpdir(), 'foundation-build-api-'));
    const files = {
      'package.json': JSON.stringify({ name: 'fixture-app' }),
      'client/routes.ts': `export default [['items','icon']].map(([name])=>({name:String(name),componentLoader:()=>import('./page.js')}));`,
      'client/page.ts': `import {useService,apiClientToken} from '@nocobase/app-client'; import {useCallback} from 'react'; export default ()=>{const api=useService(apiClientToken);const read=useCallback((path)=>api.request({path}),[api]);return read('items');};`,
      'server/routes/index.ts': `import {Hono} from 'hono'; import {read} from '@nocobase/db'; export default new Hono().get('/items',()=>read());`,
    };
    for (const [name, source] of Object.entries(files)) {
      const file =
        name === 'package.json' ? name : prefix + name.replace(/\.ts$/, '.js');
      await mkdir(path.dirname(path.join(root, file)), { recursive: true });
      await writeFile(path.join(root, file), source);
    }
    expect(await writeModuleManifest(root)).toEqual({
      routes: 1,
      complete: true,
    });
    const artifact = path.join(root, 'dist/server/foundation-modules.json');
    const first = await readFile(artifact, 'utf8');
    expect(JSON.parse(first)).toMatchObject({
      sources: { routes: [{ apiProviders: ['@nocobase/db'], complete: true }] },
    });
    await writeModuleManifest(root);
    expect(await readFile(artifact, 'utf8')).toBe(first);
    await writeFile(
      path.join(root, 'dist/package.json'),
      JSON.stringify({ name: 'fixture-app' }),
    );
    await rm(path.join(root, 'dist/client'), { recursive: true, force: true });
    expect(
      (await collectModuleSources(path.join(root, 'dist'))).routes,
    ).toEqual([
      expect.objectContaining({
        routeName: 'items',
        apiProviders: ['@nocobase/db'],
      }),
    ]);
    expect(first).not.toContain(root);
    expect(first).not.toContain('useCallback');
  },
);

it.each(['fixed first', 'conditional next'])(
  '%s builds reproducible corrected associations and reads them without business sources',
  async (name) => {
    const scenario = overlapCases.find((item) => item.name === name)!;
    await withOverlapFixture(
      scenario,
      async ({ root: fixtureRoot, sources }) => {
        expect(await writeModuleManifest(fixtureRoot)).toEqual({
          routes: 1,
          complete: scenario.complete,
        });
        const artifact = path.join(
          fixtureRoot,
          'dist/server/foundation-modules.json',
        );
        const first = await readFile(artifact, 'utf8');
        const before = (await stat(artifact)).mtimeMs;
        await writeModuleManifest(fixtureRoot);
        expect(await readFile(artifact, 'utf8')).toBe(first);
        expect((await stat(artifact)).mtimeMs).toBe(before);
        expect(JSON.parse(first).sources).toEqual(sources);
        await writeFile(
          path.join(fixtureRoot, 'dist/package.json'),
          '{"name":"app"}',
        );
        await rm(path.join(fixtureRoot, 'client'), { recursive: true });
        await rm(path.join(fixtureRoot, 'server'), { recursive: true });
        expect(
          await collectModuleSources(path.join(fixtureRoot, 'dist')),
        ).toEqual(sources);
      },
    );
  },
);
