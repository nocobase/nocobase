import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { afterEach, expect, it } from 'vitest';
import { collectModuleSources } from '../../server/module-sources.js';
import type { RuntimeProviderEvidence } from '../../server/provider-inventory.js';

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});
async function fixture(
  change: Record<string, string> = {},
  evidence: RuntimeProviderEvidence['evidence'] = 'serverRegistration',
) {
  const root = await mkdtemp(
    path.join(os.tmpdir(), 'foundation-contribution-'),
  );
  roots.push(root);
  const dependency = path.join(root, 'registered-package'),
    app = path.join(root, 'application');
  const files: Record<string, string> = {
    'application/package.json': JSON.stringify({ name: 'application' }),
    'application/client/routes.ts':
      "export default [{name:'upload',componentLoader:()=>import('./page.js')}];",
    'application/client/page.ts':
      "import {useApiClient} from '@nocobase/app-client';export default ()=>useApiClient().request({path:'files/upload',method:'POST'});",
    'application/server/plugins.ts':
      "import {defineServerPlugins} from '@nocobase/app-server/plugins';import files from '@example/files/server';export default defineServerPlugins([files]);",
    'application/server/routes/index.ts':
      "import {routes} from '@example/files/server';export default routes;",
    'registered-package/package.json': JSON.stringify({
      name: '@example/files',
      version: '1.2.3',
      exports: { './server': { import: './server/index.ts' } },
    }),
    'registered-package/server/index.ts':
      "export {default} from './plugin.js';export {routes} from './routes.js';",
    'registered-package/server/plugin.ts':
      "import path from 'node:path';import {defineServerPlugin} from '@nocobase/app-server/plugins';import serviceProviders from './providers.js';const plugin=defineServerPlugin({packageName:'@example/files',baseDir:path.resolve(import.meta.dirname,'..'),serviceProviders});export default plugin;",
    'registered-package/server/providers.ts':
      "import {ServiceProvider} from '@nocobase/service-provider';import {databaseManagerToken} from '@nocobase/db';import {token} from './token.js';class Files{constructor(private database){}list(){return this.database.query().selectFrom('files').execute();}}class Provider extends ServiceProvider{readonly name='@example/files';register(){this.app.container.singleton(token,container=>new Files(container.resolve(databaseManagerToken)));}}export default [Provider];",
    'registered-package/server/token.ts':
      "import {createServiceToken} from '@nocobase/service-provider';export const token=createServiceToken('files');",
    'registered-package/server/routes.ts':
      "import {Hono} from 'hono';import {defineApiRoutes} from '@nocobase/app-server/router';import {token} from './token.js';export const routes=defineApiRoutes(app=>{const router=new Hono();router.post('/files/upload',c=>app.container.resolve(token).list());return router;});",
    ...change,
  };
  for (const [file, text] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await writeFile(path.join(root, file), text);
  }
  return collectModuleSources(app, [
    { name: '@example/files', version: '1.2.3', rootDir: dependency, evidence },
  ]);
}
it('follows the default descriptor of the exact registered export to its selected service provider', async () => {
  expect((await fixture()).routes[0]?.collections).toEqual(['files']);
});
it.each([
  {
    'application/server/plugins.ts':
      "import {defineServerPlugins} from '@nocobase/app-server/plugins';import './routes/index.js';export default defineServerPlugins([]);",
  },
  {
    'registered-package/server/plugin.ts':
      "import path from 'node:path';import {defineServerPlugin} from '@nocobase/app-server/plugins';import serviceProviders from './providers.js';export default defineServerPlugin({packageName:'@example/files',baseDir:path.resolve(import.meta.dirname,'..'),serviceProviders,serviceProviders:unknown});",
  },
  {
    'registered-package/server/plugin.ts':
      "import path from 'node:path';import {defineServerPlugin} from '@nocobase/app-server/plugins';import serviceProviders from './providers.js';export default defineServerPlugin({packageName:'@example/files',baseDir:path.resolve(import.meta.dirname,'..'),serviceProviders,[unknown]:[]});",
  },
  {
    'registered-package/server/plugin.ts':
      "import path from 'node:path';import {defineServerPlugin} from '@nocobase/app-server/plugins';import serviceProviders from './providers.js';export default defineServerPlugin({packageName:'@example/other',baseDir:path.resolve(import.meta.dirname,'..'),serviceProviders});",
  },
  {
    'registered-package/server/index.ts':
      "export {routes} from './routes.js';import './plugin.js';export default {};",
  },
  {
    'registered-package/server/plugin.ts':
      "import path from 'node:path';import {defineServerPlugin} from '@nocobase/app-server/plugins';import serviceProviders from './providers.js';export default defineServerPlugin({packageName:'@example/files',baseDir:path.resolve(import.meta.dirname,'../outside'),serviceProviders});",
  },
  {
    'registered-package/server/providers.ts':
      "import {ServiceProvider} from '@nocobase/service-provider';import {databaseManagerToken} from '@nocobase/db';import {token} from './token.js';class Files{constructor(private database){}list(){return this.database.query().selectFrom('files').execute();}}class Provider extends ServiceProvider{register(){if(unknown)this.app.container.singleton(token,container=>new Files(container.resolve(databaseManagerToken)));}}export default [Provider];",
  },
])(
  'does not turn an unselected or unproved plugin registration into a provider: %j',
  async (change) => {
    expect((await fixture(change)).routes[0]?.collections ?? []).not.toContain(
      'files',
    );
  },
);
it.each(['Provider,Provider', 'Provider,unknownProvider'])(
  'refuses incomplete or competing provider arrays: %s',
  async (providers) => {
    const source =
      "import {ServiceProvider} from '@nocobase/service-provider';import {databaseManagerToken} from '@nocobase/db';import {token} from './token.js';class Files{constructor(private database){}list(){return this.database.query().selectFrom('files').execute();}}class Provider extends ServiceProvider{register(){this.app.container.singleton(token,container=>new Files(container.resolve(databaseManagerToken)));}}export default [" +
      providers +
      '];';
    expect(
      (await fixture({ 'registered-package/server/providers.ts': source }))
        .routes[0]?.collections ?? [],
    ).not.toContain('files');
  },
);

it('requires server registration before deriving plugin provider metadata', async () => {
  expect(
    (await fixture({}, 'apiContribution')).routes[0]?.collections ?? [],
  ).not.toContain('files');
});
