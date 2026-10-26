import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { collectModuleSources } from '../../server/module-sources.js';
import { ModuleSourceCache } from '../../server/module-source-cache.js';
import { writeModuleManifest } from '../../server/module-manifest.js';

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});
const routes = `import {Hono} from 'hono';
import {defineApiRoutes,describeRoute,dataResponse,apiErrorResponses} from '@nocobase/app-server/router';
import {authorizationToken} from '@nocobase/app-plugin-authorization/server';
import {authenticationToken} from '@nocobase/app-plugin-authentication';
import {catalogToken} from '../providers/index.js';
const doc=(operationId, summary, many=false)=>describeRoute({operationId,summary,tags:['Catalog'],responses:{'200':dataResponse({}),...apiErrorResponses}});
export default defineApiRoutes(app=>{
 const root=new Hono();const child=new Hono();
 const auth=app.container.resolve(authenticationToken);
 const identity=app.container.resolve(authorizationToken);
 const service=app.container.resolve(catalogToken);
 child.use('*',auth.required(),identity.middleware());
 child.get('/',doc('catalogList','List catalog'),c=>service.list());
 return root.route('/catalog',child);
});`;
const providers = `import {ServiceProvider,createServiceToken} from '@nocobase/service-provider';
import {databaseManagerToken} from '@nocobase/db';
export const catalogToken=createServiceToken('catalog');
class Catalog { constructor(db){this.db=db;} list(){return this.db.connection().repository('entries').findMany();} }
class Provider extends ServiceProvider { register(){ this.app.container.singleton(catalogToken,()=>new Catalog(this.app.container.resolve(databaseManagerToken))); } }
export default [Provider];`;
async function fixture(server = routes, extra: Record<string, string> = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'foundation-identity-'));
  roots.push(root);
  const files = {
    'package.json': JSON.stringify({ name: 'catalog-fixture' }),
    'client/routes.js': `export default [{name:'catalog',componentLoader:()=>import('./page.js')}];`,
    'client/page.js': `import {useApiClient} from '@nocobase/app-client';export default ()=>useApiClient().request({path:'catalog'});`,
    'server/routes/index.js': server,
    'server/providers/index.js': providers,
    'server/runtime.js': `import {defineAppRuntime} from '@nocobase/app-server/runtime';import plugins from './plugins.js';import serviceProviders from './providers/index.js';import routes from './routes/index.js';import defaultConfigs from './config/index.js';export default defineAppRuntime({plugins,serviceProviders,routes,defaultConfigs});`,
    'server/plugins.js': `import {defineServerPlugins} from '@nocobase/app-server/plugins';import authorization from '@nocobase/app-plugin-authorization/server';export default defineServerPlugins([authorization]);`,
    'server/config/index.js': `import {defaultAppConfigs} from '@nocobase/app-server/config';import authorization from './authorization.js';export default defaultAppConfigs({authorization});`,
    'server/config/authorization.js': `import {defineAppConfig} from '@nocobase/app-server/config';export default defineAppConfig(()=>({permissionSets:{rootSet:'root'}}));`,
    ...extra,
  };
  for (const [file, content] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await writeFile(path.join(root, file), content);
  }
  return root;
}

it('recognizes a service behind the official identity chain and a pure documentation wrapper', async () => {
  const result = await collectModuleSources(await fixture());
  expect(result.routes[0]?.apiProviders).toContain('@nocobase/db');
  expect(result.routes[0]?.apiEvidence).toContainEqual(
    expect.objectContaining({
      method: 'GET',
      path: '/catalog',
      providers: expect.arrayContaining(['@nocobase/db']),
      conditions: expect.arrayContaining([
        {
          kind: 'authorizationIdentityResolved',
          source:
            '@nocobase/app-plugin-authorization#authorizationToken.middleware',
        },
      ]),
    }),
  );
});

it.each([
  [
    'unknown identity step',
    routes.replace(" child.use('*',", " identity.use(opaque);child.use('*',"),
  ],
  [
    'terminating identity step',
    routes.replace(" child.use('*',", " identity.use(()=>{});child.use('*',"),
  ],
  [
    'replaced service',
    routes.replace(
      " child.use('*',",
      " app.container.instance(authorizationToken,{});child.use('*',",
    ),
  ],
  [
    'escaped service',
    routes.replace(" child.use('*',", " external(identity);child.use('*',"),
  ],
  [
    'mutated service alias',
    routes.replace(
      " child.use('*',",
      " identity.middleware=()=>opaque();child.use('*',",
    ),
  ],
  [
    'side effect in wrapper',
    routes
      .replace('=>describeRoute', '=>{ sideEffect();return describeRoute')
      .replace('export default', '};export default'),
  ],
  [
    'side effect in unused argument',
    routes.replace(
      "doc('catalogList','List catalog')",
      "doc('catalogList','List catalog',sideEffect())",
    ),
  ],
  ['mutable wrapper', routes.replace('const doc=', 'let doc=')],
  [
    'branching wrapper',
    routes
      .replace('=>describeRoute', '=>flag?describeRoute')
      .replace('export default', ':opaque();export default'),
  ],
  ['method mismatch', routes.replace("child.get('/'", "child.post('/'")],
  ['path mismatch', routes.replace("child.get('/'", "child.get('/other'")],
  [
    'terminating overlap',
    routes.replace(
      " child.get('/',",
      " child.get('/',c=>c.text('cached'));child.get('/',",
    ),
  ],
])('keeps the %s barrier', async (_name, source) => {
  const result = await collectModuleSources(await fixture(source));
  expect(result.routes[0]?.apiProviders ?? []).not.toContain('@nocobase/db');
});

it('invalidates compiled cache evidence when identity configuration changes and restores it', async () => {
  const root = await fixture();
  const cache = new ModuleSourceCache();
  const before = await cache.read(root);
  expect(before.routes[0]?.apiProviders).toContain('@nocobase/db');
  expect(await cache.read(root)).toBe(before);
  const file = path.join(root, 'server/config/authorization.js');
  const genuine = `import {defineAppConfig} from '@nocobase/app-server/config';export default defineAppConfig(()=>({}));`;
  await writeFile(file, genuine.replace('({})', '({plugins:[unknown()]})'));
  const unknown = await cache.read(root);
  expect(unknown.routes[0]?.apiProviders ?? []).not.toContain('@nocobase/db');
  await writeFile(file, genuine);
  expect((await cache.read(root)).routes[0]?.apiProviders).toContain(
    '@nocobase/db',
  );
  await writeModuleManifest(root);
  await writeFile(
    path.join(root, 'dist/package.json'),
    JSON.stringify({ name: 'catalog-fixture' }),
  );
  const built = await collectModuleSources(path.join(root, 'dist'));
  expect(built.routes[0]?.apiProviders).toContain('@nocobase/db');
});

it.each([
  [
    'authorization provider prototype replacement',
    {
      'server/providers/index.js':
        providers +
        `;import {AuthorizationProvider} from '@nocobase/app-plugin-authorization/server';AuthorizationProvider.prototype.register=unknown;`,
    },
  ],
  [
    'alternate official plugin alias',
    {
      'server/providers/index.js':
        providers +
        `;import samePlugin from '@nocobase/app-plugin-authorization/server';samePlugin.serviceProviders=[Unknown];`,
    },
  ],
  [
    'framework provider prototype replacement',
    {
      'server/providers/index.js':
        providers + `;ServiceProvider.prototype.boot=unknown;`,
    },
  ],
  [
    'escaped provider constructor',
    { 'server/providers/index.js': providers + `;external(Provider);` },
  ],
  [
    'unknown registered plugin',
    {
      'server/plugins.js': `import {defineServerPlugins} from '@nocobase/app-server/plugins';import authorization from '@nocobase/app-plugin-authorization/server';import unknown from 'unknown';export default defineServerPlugins([authorization,unknown]);`,
    },
  ],
  [
    'duplicate registration',
    {
      'server/plugins.js': `import {defineServerPlugins} from '@nocobase/app-server/plugins';import authorization from '@nocobase/app-plugin-authorization/server';export default defineServerPlugins([authorization,authorization]);`,
    },
  ],
  [
    'mutated registration list',
    {
      'server/plugins.js': `import {defineServerPlugins} from '@nocobase/app-server/plugins';import authorization from '@nocobase/app-plugin-authorization/server';const plugins=[authorization];plugins.push(unknown);export default defineServerPlugins(plugins);`,
    },
  ],
  [
    'mutated official plugin',
    {
      'server/plugins.js': `import {defineServerPlugins} from '@nocobase/app-server/plugins';import authorization from '@nocobase/app-plugin-authorization/server';authorization.serviceProviders=[Unknown];export default defineServerPlugins([authorization]);`,
    },
  ],
  [
    'custom configuration plugin',
    {
      'server/config/authorization.js': `import {defineAppConfig} from '@nocobase/app-server/config';export default defineAppConfig(()=>({plugins:[{id:'stop',setup(a){a.use(()=>{});}}]}));`,
    },
  ],
  [
    'uninspected runtime',
    { 'server/runtime.js': `export default unknownRuntime();` },
  ],
])('keeps %s unknown', async (_name, extra) => {
  const result = await collectModuleSources(await fixture(routes, extra));
  expect(result.routes[0]?.apiProviders ?? []).not.toContain('@nocobase/db');
});

it('retains all five distinct success conditions in the generated manifest', async () => {
  const source = routes
    .replace(
      'import {Hono}',
      "import {databaseManagerToken} from '@nocobase/db';import {bodyLimit} from 'hono/body-limit';import {apiValidator} from '@nocobase/app-server/router';import {z} from 'zod';import {Hono}",
    )
    .replace(
      ' const auth=',
      " if(!app.container.has(databaseManagerToken)){child.all('*',c=>c.text('unavailable',503));return root.route('/catalog',child);} const auth=",
    )
    .replace(
      'identity.middleware());',
      'identity.middleware(),bodyLimit({maxSize:1024}));',
    )
    .replace(
      "doc('catalogList','List catalog'),",
      "doc('catalogList','List catalog'),apiValidator('query',z.object({})),",
    );
  const root = await fixture(source);
  const result = await collectModuleSources(root);
  const evidence = result.routes[0]?.apiEvidence?.find((item) =>
    item.providers.includes('@nocobase/db'),
  );
  expect(evidence?.conditions.map((item) => item.kind)).toEqual([
    'databaseAvailable',
    'authenticated',
    'authorizationIdentityResolved',
    'bodyWithinLimit',
    'validInput',
  ]);
  await expect(writeModuleManifest(root)).resolves.toMatchObject({ routes: 1 });
});

it('recognizes a second business layout with an instance service, deeper mounts and a block-bodied documentation factory', async () => {
  const source = routes
    .replace("'/catalog'", "'/books'")
    .replace(
      "return root.route('/books',child);",
      "const section=new Hono();section.route('/books',child);return root.route('/library',section);",
    )
    .replace(
      "=>describeRoute({operationId,summary,tags:['Catalog'],responses:{'200':dataResponse({}),...apiErrorResponses}})",
      "=>{const tags=['Library'];return describeRoute({operationId,summary,tags,responses:{'200':dataResponse({}),...apiErrorResponses}});}",
    );
  const root = await fixture(source, {
    'client/page.js': `import {useApiClient} from '@nocobase/app-client';export default ()=>useApiClient().request({path:'library/books'});`,
    'server/providers/index.js': providers.replace(
      'this.app.container.singleton(catalogToken,()=>new Catalog(this.app.container.resolve(databaseManagerToken)))',
      'this.app.container.instance(catalogToken,new Catalog(this.app.container.resolve(databaseManagerToken)))',
    ),
  });
  const result = await collectModuleSources(root);
  expect(result.routes[0]?.apiProviders).toContain('@nocobase/db');
  expect(
    result.routes[0]?.apiEvidence?.find((item) =>
      item.providers.includes('@nocobase/db'),
    )?.path,
  ).toBe('/library/books');
  await writeModuleManifest(root);
  await writeFile(
    path.join(root, 'dist/package.json'),
    JSON.stringify({ name: 'catalog-fixture' }),
  );
  await rm(path.join(root, 'server'), { recursive: true });
  await rm(path.join(root, 'client'), { recursive: true });
  const cache = new ModuleSourceCache();
  const built = await cache.read(path.join(root, 'dist'));
  expect(built).toEqual(result);
  expect(await cache.read(path.join(root, 'dist'))).toBe(built);
});

const bootstrap = `import {createAppFromRuntime} from '@nocobase/app-server/runtime';export function createApp(runtime){const app=createAppFromRuntime(runtime);app.addRuntimeContributions(runtime);return app;}`;
const embedded = `import {resolveAppRuntime,startApplicationInScope} from '@nocobase/app-server/runtime';import definition from './runtime.js';import {createApp} from './app.js';export async function createServer(scope){const runtime=await resolveAppRuntime(definition,scope);const app=createApp(runtime);return startApplicationInScope(scope,app);}`;
it.each([
  ['the inspected runtime', bootstrap, true],
  [
    'an opaque runtime',
    bootstrap.replace(
      'createAppFromRuntime(runtime)',
      'createAppFromRuntime(unknownRuntime)',
    ),
    false,
  ],
  [
    'opaque runtime contributions',
    bootstrap.replace(
      'addRuntimeContributions(runtime)',
      'addRuntimeContributions(unknownRuntime)',
    ),
    false,
  ],
  [
    'an opaque bootstrap route',
    bootstrap.replace(
      'return app;',
      'app.addRoutes(unknownRoutes);return app;',
    ),
    false,
  ],
])(
  'checks %s through the actual bootstrap',
  async (_name, source, recognized) => {
    const result = await collectModuleSources(
      await fixture(routes, {
        'server/app.js': source,
        'server/embedded.js': embedded,
      }),
    );
    expect(
      result.routes[0]?.apiProviders?.includes('@nocobase/db') ?? false,
    ).toBe(recognized);
  },
);

it.each(['plugins', "'plugins'", '"plugins"'])(
  'retains the identity barrier for %s configuration keys',
  async (key) => {
    const result = await collectModuleSources(
      await fixture(routes, {
        'server/config/authorization.js': `import {defineAppConfig} from '@nocobase/app-server/config';export default defineAppConfig(()=>({${key}:[{id:'stop',setup(a){a.use(()=>{});}}]}));`,
      }),
    );
    expect(result.routes[0]?.apiProviders ?? []).not.toContain('@nocobase/db');
  },
);

it.each([
  [
    'configuration plugins',
    'server/config/authorization.js',
    `import {defineAppConfig} from '@nocobase/app-server/config';export default defineAppConfig(()=>({plugins:unknown,'plugins':[]}));`,
  ],
  [
    'runtime providers',
    'server/runtime.js',
    `import {defineAppRuntime} from '@nocobase/app-server/runtime';import plugins from './plugins.js';import defaultConfigs from './config/index.js';export default defineAppRuntime({plugins,defaultConfigs,'serviceProviders':unknown});`,
  ],
  [
    'duplicate runtime providers',
    'server/runtime.js',
    `import {defineAppRuntime} from '@nocobase/app-server/runtime';import plugins from './plugins.js';import serviceProviders from './providers/index.js';import defaultConfigs from './config/index.js';export default defineAppRuntime({plugins,defaultConfigs,serviceProviders,'serviceProviders':unknown});`,
  ],
  [
    'duplicate runtime config factory',
    'server/runtime.js',
    `import {defineAppRuntime} from '@nocobase/app-server/runtime';import plugins from './plugins.js';import defaultConfigs from './config/index.js';export default defineAppRuntime({plugins,defaultConfigs,createAppConfig:unknown,'createAppConfig':other});`,
  ],
  [
    'duplicate authorization default',
    'server/config/index.js',
    `import {defaultAppConfigs} from '@nocobase/app-server/config';import authorization from './authorization.js';export default defaultAppConfigs({authorization,'authorization':unknown});`,
  ],
  [
    'computed configuration',
    'server/config/authorization.js',
    `import {defineAppConfig} from '@nocobase/app-server/config';export default defineAppConfig(()=>({[key]:unknown}));`,
  ],
])('rejects ambiguous or unproven %s', async (_name, file, source) => {
  const result = await collectModuleSources(
    await fixture(routes, { [file]: source }),
  );
  expect(result.routes[0]?.apiProviders ?? []).not.toContain('@nocobase/db');
});

const wrappers = [
  'opts',
  '(opts)',
  '((opts))',
  '(opts as object)',
  '(opts satisfies object)',
  'opts!',
  '(<object>opts)',
  '((opts as object)!)',
];
it.each(wrappers)(
  'rejects documentation object escape through %s',
  async (wrapped) => {
    const source = routes
      .replace(
        'const doc=',
        `const opts={};Object.defineProperty(${wrapped},'summary',{enumerable:true,get(){throw new Error('side effect')}});const doc=`,
      )
      .replace(
        'operationId,summary,tags:',
        '...opts,operationId,summary,tags:',
      );
    const root = await fixture(source);
    // Preserve TypeScript wrappers in the source fixture, as authored by applications.
    await rm(path.join(root, 'server/routes/index.js'));
    await writeFile(path.join(root, 'server/routes/index.ts'), source);
    const result = await collectModuleSources(root);
    expect(result.routes[0]?.apiProviders ?? []).not.toContain('@nocobase/db');
  },
);
it.each(wrappers)(
  'recognizes immutable documentation values through %s',
  async (wrapped) => {
    const source = routes
      .replace('const doc=', 'const opts={summary:"List catalog"};const doc=')
      .replace(
        'operationId,summary,tags:',
        `...${wrapped},operationId,summary,tags:`,
      );
    const root = await fixture(source);
    await rm(path.join(root, 'server/routes/index.js'));
    await writeFile(path.join(root, 'server/routes/index.ts'), source);
    const result = await collectModuleSources(root);
    expect(result.routes[0]?.apiProviders).toContain('@nocobase/db');
  },
);

it('recognizes quoted registration keys with the same meaning as identifier keys', async () => {
  const root = await fixture(routes, {
    'server/runtime.js': `import {defineAppRuntime} from '@nocobase/app-server/runtime';import plugins from './plugins.js';import serviceProviders from './providers/index.js';import routes from './routes/index.js';import defaultConfigs from './config/index.js';export default defineAppRuntime({'plugins':plugins,'serviceProviders':serviceProviders,routes,'defaultConfigs':defaultConfigs});`,
    'server/config/index.js': `import {defaultAppConfigs} from '@nocobase/app-server/config';import authorization from './authorization.js';export default defaultAppConfigs({'authorization':authorization});`,
    'server/config/authorization.js': `import {defineAppConfig} from '@nocobase/app-server/config';export default defineAppConfig(()=>({'plugins':[]}));`,
  });
  expect((await collectModuleSources(root)).routes[0]?.apiProviders).toContain(
    '@nocobase/db',
  );
});
