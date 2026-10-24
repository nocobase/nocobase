import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { Application } from '@nocobase/app-server/application';
import { AppConfig, createAppPaths } from '@nocobase/app-server/config';
import { resolveAppScopePaths } from '@nocobase/app-server/runtime';
import { afterEach, expect, it } from 'vitest';

import { writeModuleManifest } from '../../server/module-manifest.js';
import { FoundationProvider } from '../../server/providers/foundation.js';
import { foundationServiceToken } from '../../server/tokens.js';

const directories: string[] = [];

afterEach(async () => {
  for (const directory of directories.splice(0))
    await rm(directory, { recursive: true, force: true });
});

it.each(['source', 'standalone', 'embedded'] as const)(
  'reads application packages and page associations in a %s layout',
  async (layout) => {
    const directory = await mkdtemp(
      path.join(os.tmpdir(), 'foundation-paths-'),
    );
    directories.push(directory);
    const source = path.join(directory, 'source');
    const manifest = {
      name: 'fixture-app',
      dependencies: {
        '@nocobase/app-plugin-file': '1.0.0',
        '@nocobase/db': '1.0.0',
      },
    };
    const files = {
      'package.json': JSON.stringify(manifest),
      'client/routes.ts': `export default [{name:'files',componentLoader:()=>import('./page.js')}];`,
      'client/page.ts': `import {FileList} from '@nocobase/app-plugin-file/client'; import {useApiClient} from '@nocobase/app-client'; export default ()=>{useApiClient().request({path:'files'});return FileList();};`,
      'server/routes/index.ts': `import {Hono} from 'hono'; import {read} from '@nocobase/db'; export default new Hono().get('/files',()=>read());`,
    };
    for (const [file, contents] of Object.entries(files))
      await put(path.join(source, file), contents);
    await writeModuleManifest(source);
    // A previous build must not replace the source application's identity during local development.
    await put(
      path.join(source, 'dist/package.json'),
      JSON.stringify({ name: 'stale-build' }),
    );

    const hostRoot =
      layout === 'source' ? source : path.join(directory, 'release');
    const packageRoot =
      layout === 'embedded' ? path.join(hostRoot, 'dist') : hostRoot;
    if (layout !== 'source') {
      // A deployed package has built assets and metadata, without client page sources.
      await put(
        path.join(packageRoot, 'package.json'),
        JSON.stringify(manifest),
      );
      await mkdir(path.join(packageRoot, 'server'), { recursive: true });
      await cp(
        path.join(source, 'dist/server/foundation-modules.json'),
        path.join(packageRoot, 'server/foundation-modules.json'),
      );
      await mkdir(path.join(packageRoot, 'client'), { recursive: true });
      await rm(source, { recursive: true });
    }
    for (const name of Object.keys(manifest.dependencies))
      await put(
        path.join(packageRoot, 'node_modules', name, 'package.json'),
        JSON.stringify({ name, version: '1.0.0' }),
      );

    const paths = createAppPaths(
      layout === 'standalone'
        ? { rootDir: packageRoot, serverDir: path.join(packageRoot, 'server') }
        : resolveAppScopePaths({
            id: 'fixture',
            basePath: '/fixture',
            rootDir: hostRoot,
            registerDisposer() {},
          }),
    );
    const config = new AppConfig();
    await config.loadAll();
    const app = new Application({ paths, config });
    app.addServiceProvider(FoundationProvider);
    await app.start();
    try {
      const overview = await app.container
        .resolve(foundationServiceToken)
        .overview();
      expect(overview.inventory).toMatchObject({
        complete: true,
        unreadable: [],
      });
      for (const name of Object.keys(manifest.dependencies))
        expect(overview.inventory?.entries).toContainEqual(
          expect.objectContaining({ name, installed: true, version: '1.0.0' }),
        );
      expect(overview.moduleSources).toEqual({
        complete: true,
        routes: [
          {
            packageName: manifest.name,
            routeName: 'files',
            providers: ['@nocobase/app-client', '@nocobase/app-plugin-file'],
            apiProviders: ['@nocobase/db'],
            complete: true,
          },
        ],
      });
    } finally {
      await app.shutdown();
    }
  },
);

async function put(file: string, contents: string): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, contents);
}
