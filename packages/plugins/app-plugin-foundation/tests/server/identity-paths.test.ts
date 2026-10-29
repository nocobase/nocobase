import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { collectModuleSources } from '../../server/module-sources.js';
import { ModuleSourceCache } from '../../server/module-source-cache.js';
import { writeModuleManifest } from '../../server/module-manifest.js';

import { staticToolRegistry } from '../fixtures/static-tools.js';

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

it.each([
  'external(()=>opts);',
  'external(()=>((opts)));',
  'externalValue=(opts);',
  'new External((opts));',
  'external({...opts});',
  'external(({value:(opts)}));',
  'external(true?(opts):{});',
  '(opts).summary=unknown;',
])('rejects unproven documentation object use: %s', async (use) => {
  const source = routes
    .replace('const doc=', `const opts={};${use}const doc=`)
    .replace('operationId,summary,tags:', '...opts,operationId,summary,tags:');
  const result = await collectModuleSources(await fixture(source));
  expect(result.routes[0]?.apiProviders ?? []).not.toContain('@nocobase/db');
});

// The authorization service and container may travel through local objects, classes and registrations; each use
// is still checked, and any flow out of what this graph can see keeps the barrier.
const holding = (
  declarations: string,
  body: string,
): Record<string, string> => ({
  'server/providers/index.js':
    `import {authorizationToken} from '@nocobase/app-plugin-authorization/server';import {external} from 'unknown';\n` +
    providers
      .replace('class Provider', `${declarations}\nclass Provider`)
      .replace(
        'register(){',
        `register(){const container=this.app.container;const authz=container.resolve(authorizationToken);${body}`,
      ),
});
const scope = `.for({principal:{type:'user',id:'1'},subjects:[]})`;

it.each([
  [
    'a dependencies object read by a local function',
    holding(
      `function inspect(deps){return deps.authz${scope};}`,
      'inspect({authz});',
    ),
  ],
  [
    'a class instance holding the container',
    holding(
      `class Reader{constructor(container){this.container=container;}read(){return this.container.resolve(catalogToken);}}`,
      'new Reader(container).read();',
    ),
  ],
  [
    'composed class instances',
    holding(
      `class Turn{constructor(c){this.c=c;}run(){return this.c.resolve(catalogToken);}}class Adapter{constructor(turn){this.turn=turn;}go(){return this.turn.run();}static label(x){return String(x);}}const adapterToken=createServiceToken('adapter');`,
      'container.singleton(adapterToken,()=>new Adapter(new Turn(container)));Adapter.label(1);',
    ),
  ],
  [
    'a holder registered under an own token',
    holding(
      `const platformToken=createServiceToken('platform');`,
      `container.singleton(platformToken,()=>({authz,label:'x'}));container.resolve(platformToken).authz${scope};`,
    ),
  ],
  [
    'a function returned from a local factory',
    holding(
      `function notifier(c){return async()=>c.has(catalogToken);}function createPlatform(deps){const {authz,notify}=deps;return {authz,notify};}`,
      'const platform=createPlatform({authz,notify:notifier(container)});platform.notify();',
    ),
  ],
  [
    'iteration over a local array of holders',
    holding(
      `function check(a){return a${scope};}`,
      'for(const item of [{authz}])check(item.authz);',
    ),
  ],
])('follows %s', async (_name, extra) => {
  const result = await collectModuleSources(await fixture(routes, extra));
  expect(result.routes[0]?.apiProviders).toContain('@nocobase/db');
});

it.each([
  [
    'a nested object handed to unknown code',
    holding('', 'external({deps:{authz}});'),
  ],
  [
    'a closure returning the container to unknown code',
    holding('', 'external(()=>container);'),
  ],
  [
    'a function declaration returning it to unknown code',
    holding('', 'function give(){return authz;}external(give);'),
  ],
  [
    'an array alias calling use',
    holding('', 'const list=[authz];list[0].use(()=>{});'),
  ],
  [
    'an array method over holders',
    holding('', 'const list=[authz];list.forEach(a=>a.use(()=>{}));'),
  ],
  ['a method alias', holding('', 'const add=authz.use;add(()=>{});')],
  ['a destructured method', holding('', 'const {use}=authz;use(()=>{});')],
  ['the identity step list', holding('', 'authz.middlewares.push(()=>{});')],
  [
    'a field of a holder calling use',
    holding('', 'const deps={authz};deps.authz.use(()=>{});'),
  ],
  [
    'a parameter calling use',
    holding(
      'function inspect(deps){deps.authz.use(()=>{});}',
      'inspect({authz});',
    ),
  ],
  [
    'a holder field overwritten',
    holding('', 'const deps={authz};deps.authz={};'),
  ],
  [
    'an unknown method of a holder',
    holding('', 'const deps={authz};deps.run(()=>{});'),
  ],
  [
    'an instance handed to unknown code',
    holding(
      'class Holder{constructor(c){this.c=c;}}',
      'external(new Holder(container));',
    ),
  ],
  [
    'a class capturing the service handed to unknown code',
    holding('', 'class Holder{a=authz;}external(Holder);'),
  ],
  [
    'an uncalled method returning the service',
    holding('', 'const o={get(){return authz;}};external(o.get);'),
  ],
  [
    'an uncalled method extracted by a bracket key',
    holding('', "const o={get(){return authz;}};external(o['get']);"),
  ],
  [
    'an uncalled method extracted through a dynamic key',
    holding(
      '',
      "const key=Math.random()?'get':'label';const o={get(){return authz;},label:'safe'};external(o[key]);",
    ),
  ],
  [
    'an array element method extracted by a bracket key',
    holding(
      '',
      "const list=[{get(){return authz;}}];external(list[0]['get']);",
    ),
  ],
  [
    'a bracket method returning a closure with the service',
    holding('', "const o={get(){return ()=>authz;}};external(o['get']);"),
  ],
  [
    'a destructured method that returns the service',
    holding('', 'const o={get(){return authz;}};const {get}=o;external(get);'),
  ],
  [
    'a copied method bound to another receiver',
    holding(
      '',
      'const o={authz,run(){return this.authz;}};const copy={...o,authz:1};copy.run();',
    ),
  ],
  [
    'a holder registered under a foreign token',
    holding(
      "import {databaseManagerToken as foreign} from '@nocobase/db';",
      'container.singleton(foreign,()=>({authz}));',
    ),
  ],
  [
    'a holder registered under a dynamic token',
    holding('const tokens={};', 'container.instance(tokens.x,{authz});'),
  ],
  [
    'Object.assign into an unknown target',
    holding('const target={};', 'Object.assign(target,{authz});'),
  ],
  ['a callback returning a holder', holding('', '[1].map(()=>({authz}));')],
  [
    'a conditional alias calling use',
    holding('', 'const a=Math.random()?authz:null;a.use(()=>{});'),
  ],
])('keeps the barrier for %s', async (_name, extra) => {
  const result = await collectModuleSources(await fixture(routes, extra));
  expect(result.routes[0]?.apiProviders ?? []).not.toContain('@nocobase/db');
});

const plugins = (list: string, imports = ''): Record<string, string> => ({
  'server/plugins.js': `import {defineServerPlugins} from '@nocobase/app-server/plugins';import authorization from '@nocobase/app-plugin-authorization/server';${imports}export default defineServerPlugins([${list}]);`,
});
const middleware = (handler: string): Record<string, string> => ({
  'server/app.js': bootstrap
    .replace(
      "import {createAppFromRuntime} from '@nocobase/app-server/runtime';",
      `import {createAppFromRuntime} from '@nocobase/app-server/runtime';import {defineHttpMiddleware} from '@nocobase/app-server/router';const headers=defineHttpMiddleware({name:'headers',register(router,app){const flag=app.config.get('headers');if(flag===false)return;router.use('*',${handler});}});`,
    )
    .replace(
      'app.addRuntimeContributions',
      'app.addHttpMiddleware(headers);app.addRuntimeContributions',
    ),
  'server/embedded.js': embedded,
});

it.each([
  [
    'the reviewed agents and knowledge plugins with a route override',
    plugins(
      `authorization,agents,{...knowledge,routes:[local]}`,
      `import agents from '@nocobase/app-plugin-agents/server';import knowledge from '@nocobase/app-plugin-knowledge/server';import local from './local-routes.js';`,
    ),
  ],
  [
    'pure authorization helpers and configuration reads',
    holding(
      `import {condition,AuthorizationDeniedError} from '@nocobase/app-plugin-authorization/server';`,
      `condition('id','$eq',1);String(AuthorizationDeniedError);String(this.app.appName+this.app.publicBasePath);authz.onGrantsChanged(()=>{});`,
    ),
  ],
  [
    'a local pass-through HTTP middleware',
    middleware(
      `async(c,next)=>{if(/api/.test(c.req.path))return next();await next();c.res.headers.set('x-test','1');}`,
    ),
  ],
  [
    'a container token read through import()',
    holding(
      '',
      `container.resolve((await import('@nocobase/db')).databaseManagerToken);`,
    ),
  ],
])('accepts %s', async (_name, extra) => {
  const files = {
    ...extra,
    'server/local-routes.js': `import {defineApiRoutes} from '@nocobase/app-server/router';import {Hono} from 'hono';export default defineApiRoutes(()=>new Hono());`,
  };
  if (files['server/providers/index.js'])
    files['server/providers/index.js'] = files[
      'server/providers/index.js'
    ].replace('register(){', 'async register(){');
  const result = await collectModuleSources(await fixture(routes, files));
  expect(result.routes[0]?.apiProviders).toContain('@nocobase/db');
});

it.each([
  [
    'a route override with providers',
    plugins(
      `authorization,{...knowledge,serviceProviders:[]}`,
      `import knowledge from '@nocobase/app-plugin-knowledge/server';`,
    ),
  ],
  [
    'a route override computed elsewhere',
    plugins(
      `authorization,{...knowledge,routes:make()}`,
      `import knowledge from '@nocobase/app-plugin-knowledge/server';`,
    ),
  ],
  [
    'an unreviewed authorization export',
    holding(
      `import {Authorization} from '@nocobase/app-plugin-authorization/server';`,
      'String(Authorization);',
    ),
  ],
  ['a written application name', holding('', "this.app.appName='other';")],
  [
    'a middleware that may stop the request',
    middleware(
      `async(c,next)=>{if(c.req.path==='/x')return c.text('stop');await next();}`,
    ),
  ],
  [
    'a middleware that sets a request variable',
    middleware(`async(c,next)=>{c.set('auth',null);await next();}`),
  ],
  [
    'a middleware calling next twice',
    middleware(`async(c,next)=>{await next();await next();}`),
  ],
])('keeps the barrier for %s', async (_name, extra) => {
  const result = await collectModuleSources(await fixture(routes, extra));
  expect(result.routes[0]?.apiProviders ?? []).not.toContain('@nocobase/db');
});

it('reads an application larger than the former 400-file budget', async () => {
  const imports = Array.from(
    { length: 450 },
    (_, i) => `import './f${i}.js';`,
  ).join('');
  const files = Object.fromEntries(
    Array.from({ length: 450 }, (_, i) => [
      `server/routes/f${i}.js`,
      `export const value=${i};`,
    ]),
  );
  const result = await collectModuleSources(
    await fixture(imports + routes, files),
  );
  expect(result.routes[0]?.apiProviders).toContain('@nocobase/db');
});

it('proves the complete identity graph through static token tables and a local Map registry', async () => {
  const result = await collectModuleSources(
    await fixture(routes, staticToolRegistry),
  );
  expect(result.routes[0]?.apiProviders).toContain('@nocobase/db');
});

const toolsFile = 'server/ai/tools.js';
const contractsFile = 'server/ai/contracts.js';
const registryFile = 'server/ai/index.js';
it.each([
  [
    'tool exports authorization',
    toolsFile,
    'scope(ctx.deps.authz,String(ctx.actor.id));',
    'external(ctx.deps.authz);',
  ],
  [
    'tool installs an identity step',
    toolsFile,
    'scope(ctx.deps.authz,String(ctx.actor.id));',
    'ctx.deps.authz.use(()=>{});',
  ],
  [
    'token table is mutated',
    toolsFile,
    'export const countEntries',
    'getEntries.dependencies.authz=unknown;export const countEntries',
  ],
  [
    'token table escapes',
    toolsFile,
    'export const countEntries',
    'external(getEntries.dependencies);export const countEntries',
  ],
  [
    'token table contains an unknown token',
    toolsFile,
    'core:catalogToken,authz:authorizationToken',
    'core:catalogToken,authz:unknown',
  ],
  [
    'token table contains a spread',
    toolsFile,
    'core:catalogToken,authz:authorizationToken',
    'core:catalogToken,...unknown,authz:authorizationToken',
  ],
  [
    'same key names different tokens',
    toolsFile,
    'dependencies:{core:catalogToken}',
    'dependencies:{authz:catalogToken}',
  ],
  [
    'callback changes the key',
    contractsFile,
    '[key,container.resolve(token)]',
    "['changed',container.resolve(token)]",
  ],
  [
    'callback runs a side effect',
    contractsFile,
    '=>[key,container.resolve(token)]',
    '=>{external(container);return [key,container.resolve(token)];}',
  ],
  [
    'Map escapes',
    registryFile,
    'return {tools};',
    'external(tools);return {tools};',
  ],
  [
    'Map has an unknown operation',
    registryFile,
    'return {tools};',
    'tools.unknown();return {tools};',
  ],
  [
    'Map method is replaced',
    registryFile,
    'return {tools};',
    'tools.get=unknown;return {tools};',
  ],
  [
    'Map constructor is shadowed',
    registryFile,
    'const tools=new Map();',
    'const Map=unknown;const tools=new Map();',
  ],
  [
    'registry array is pushed',
    registryFile,
    'await manager.registerTools([getEntries,countEntries]);',
    'const entries=[getEntries,countEntries];entries.push({execute:c=>external(c)});await manager.registerTools(entries);',
  ],
  [
    'registry array is unshifted',
    registryFile,
    'await manager.registerTools([getEntries,countEntries]);',
    'const entries=[getEntries,countEntries];entries.unshift({execute:c=>external(c)});await manager.registerTools(entries);',
  ],
  [
    'registry array is spliced',
    registryFile,
    'await manager.registerTools([getEntries,countEntries]);',
    'const entries=[getEntries,countEntries];entries.splice(0,1,{execute:c=>external(c)});await manager.registerTools(entries);',
  ],
])('rejects local registry when %s', async (_name, file, from, to) => {
  const originals: Record<string, string> = staticToolRegistry;
  expect(originals[file]).toContain(from);
  const result = await collectModuleSources(
    await fixture(routes, {
      ...originals,
      [file]: originals[file].replace(from, to),
    }),
  );
  expect(result.routes[0]?.apiProviders ?? []).not.toContain('@nocobase/db');
});

it.each([
  [
    'awaited synchronous throw',
    'function stop(){throw new Error("stop");}',
    'await stop();',
    false,
  ],
  [
    'awaited rejection',
    'async function stop(){throw new Error("stop");}',
    'await stop();',
    false,
  ],
  [
    'nested returned rejection',
    'async function inner(){throw new Error("stop");}function stop(){return inner();}',
    'await stop();',
    false,
  ],
  [
    'awaited normal return',
    'async function stop(){return 1;}',
    'await stop();',
    true,
  ],
  [
    'unawaited rejection',
    'async function stop(){throw new Error("stop");}',
    'stop();',
    true,
  ],
  [
    'unawaited synchronous throw',
    'function stop(){throw new Error("stop");}',
    'stop();',
    false,
  ],
  [
    'generator is not started',
    'function* stop(){throw new Error("stop");}',
    'stop();',
    true,
  ],
])(
  'traces service evidence after %s with JavaScript continuation semantics',
  async (_name, helper, prefix, expected) => {
    const source = providers
      .replace('class Catalog', `${helper}class Catalog`)
      .replace('list(){return', `async list(){${prefix}return`);
    const result = await collectModuleSources(
      await fixture(routes, { 'server/providers/index.js': source }),
    );
    expect(
      (result.routes[0]?.apiProviders ?? []).includes('@nocobase/db'),
    ).toBe(expected);
  },
);

const factoryProviders = `import {ServiceProvider,createServiceToken} from '@nocobase/service-provider';
import {databaseManagerToken} from '@nocobase/db';
import {authorizationToken} from '@nocobase/app-plugin-authorization/server';
export const catalogToken=createServiceToken('catalog');
const platformToken=createServiceToken('platform');
function createPlatform(deps){const {database,authz}=deps;return {database,authz};}
function createCatalog(deps){const {platform}=deps;return {async list(){return platform.database.query().selectFrom('entries').execute();}};}
class Provider extends ServiceProvider { register(){ const container=this.app.container;
 container.singleton(platformToken,()=>createPlatform({database:container.resolve(databaseManagerToken),authz:container.resolve(authorizationToken)}));
 container.singleton(catalogToken,()=>createCatalog({platform:container.resolve(platformToken)})); } }
export default [Provider];`;
it.each([
  ['nested platform and service factories', factoryProviders, true],
  [
    'method does not use database',
    factoryProviders.replace(
      "return platform.database.query().selectFrom('entries').execute();",
      'return [];',
    ),
    false,
  ],
  [
    'operation follows await rejection',
    factoryProviders.replace(
      'async list(){return',
      'async list(){await stop();return',
    ) + 'async function stop(){throw new Error("stop");}',
    false,
  ],
  [
    'competing service registration',
    factoryProviders.replace(
      'container.singleton(catalogToken,',
      'container.instance(catalogToken,unknown);container.singleton(catalogToken,',
    ),
    false,
  ],
])(
  'retains invocation bindings through %s',
  async (_name, source, expected) => {
    const result = await collectModuleSources(
      await fixture(routes, { 'server/providers/index.js': source }),
    );
    expect(
      (result.routes[0]?.apiProviders ?? []).includes('@nocobase/db'),
    ).toBe(expected);
  },
);

it.each([
  [
    'normal router helper',
    'function guard(router){router.use("*", async(c,next)=>next());return router;}',
    true,
  ],
  [
    'terminating router helper',
    'function guard(router){stop();return router;}function stop(){throw new Error("stop");}',
    false,
  ],
  [
    'unknown router operation',
    'function guard(router){external(router);return router;}',
    false,
  ],
])(
  'keeps registration order and barriers for %s',
  async (_name, helper, expected) => {
    const source = routes
      .replace(
        'export default defineApiRoutes',
        `${helper}export default defineApiRoutes`,
      )
      .replace('const child=new Hono();', 'const child=guard(new Hono());');
    const result = await collectModuleSources(await fixture(source));
    expect(
      (result.routes[0]?.apiProviders ?? []).includes('@nocobase/db'),
    ).toBe(expected);
  },
);

it('keeps shared factory scopes and named model evidence isolated from an unused service', async () => {
  const source = factoryProviders
    .replace(
      'const platformToken=',
      "const otherToken=createServiceToken('other');const platformToken=",
    )
    .replace("selectFrom('entries')", 'selectFrom(deps.table)')
    .replace(
      'createCatalog({platform:container.resolve(platformToken)})',
      "createCatalog({platform:container.resolve(platformToken),table:'entries'})",
    )
    .replace(
      'container.singleton(catalogToken,',
      "container.singleton(otherToken,()=>createCatalog({platform:container.resolve(platformToken),table:'unselected'}));container.singleton(catalogToken,",
    );
  const result = await collectModuleSources(
    await fixture(routes, { 'server/providers/index.js': source }),
  );
  expect(result.routes[0]?.apiProviders).toContain('@nocobase/db');
  expect(result.routes[0]?.collections).toEqual(['entries']);
});

it('does not use a promise as an unawaited returned service object', async () => {
  const source = factoryProviders.replace(
    'function createCatalog',
    'async function createCatalog',
  );
  const result = await collectModuleSources(
    await fixture(routes, { 'server/providers/index.js': source }),
  );
  expect(result.routes[0]?.apiProviders ?? []).not.toContain('@nocobase/db');
});

it.each([
  ['called', 'this.install();', true],
  ['unused', '', false],
  ['throw before install', 'stop();this.install();', false],
])(
  'follows only %s private provider registration helpers',
  async (_name, call, expected) => {
    const source =
      providers.replace(
        'register(){ this.app.container.singleton',
        `register(){${call}} install(){this.app.container.singleton`,
      ) + 'function stop(){throw new Error("stop");}';
    const result = await collectModuleSources(
      await fixture(routes, { 'server/providers/index.js': source }),
    );
    expect(
      (result.routes[0]?.apiProviders ?? []).includes('@nocobase/db'),
    ).toBe(expected);
  },
);

it.each([
  ['database handle overwrite', 'platform.database=unknown;'],
  ['database handle deletion', 'delete platform.database;'],
  ['database handle escape', 'external(platform.database);'],
])('rejects a factory service after %s', async (_name, prefix) => {
  const source = factoryProviders.replace(
    'async list(){return',
    `async list(){${prefix}return`,
  );
  const result = await collectModuleSources(
    await fixture(routes, { 'server/providers/index.js': source }),
  );
  expect(result.routes[0]?.apiProviders ?? []).not.toContain('@nocobase/db');
});

it('retains the barrier when an opaque peer factory runs before returning a selected service', async () => {
  const source =
    factoryProviders.replace(
      'function createCatalog(deps){',
      'function createCatalog(deps){const peer=opaquePeer(deps.secret);',
    ) + 'function opaquePeer(secret){const key=external(secret);return {key};}';
  const result = await collectModuleSources(
    await fixture(routes, { 'server/providers/index.js': source }),
  );
  expect(result.routes[0]?.apiProviders ?? []).not.toContain('@nocobase/db');
});

it.each([
  [
    'Object entry reader replaced',
    'server/ai/contracts.js',
    'Object.entries=unknown;',
  ],
  [
    'Map prototype replaced',
    'server/ai/index.js',
    'Map.prototype.get=unknown;',
  ],
])('rejects a registry contract after %s', async (_name, file, prefix) => {
  const originals: Record<string, string> = staticToolRegistry;
  const result = await collectModuleSources(
    await fixture(routes, { ...originals, [file]: prefix + originals[file] }),
  );
  expect(result.routes[0]?.apiProviders ?? []).not.toContain('@nocobase/db');
});

it.each([
  ['closed local dependency spread', 'return {...deps};', true],
  ['unknown dependency spread', 'return {...unknown,database,authz};', false],
])('retains the spread boundary for %s', async (_name, returned, expected) => {
  const source = factoryProviders.replace('return {database,authz};', returned);
  const result = await collectModuleSources(
    await fixture(routes, { 'server/providers/index.js': source }),
  );
  expect((result.routes[0]?.apiProviders ?? []).includes('@nocobase/db')).toBe(
    expected,
  );
});

it.each([
  'function guard(router){return router;}guard=unknown;',
  'async function guard(router){return router;}',
  'let guard=(router)=>router;',
  'function guard(router){router=new Hono();return router;}',
])(
  'rejects router forwarding with a mutable helper or parameter: %s',
  async (helper) => {
    const source = routes
      .replace(
        'export default defineApiRoutes',
        `${helper}export default defineApiRoutes`,
      )
      .replace('const child=new Hono();', 'const child=guard(new Hono());');
    const result = await collectModuleSources(await fixture(source));
    expect(result.routes[0]?.apiProviders ?? []).not.toContain('@nocobase/db');
  },
);

it.each([
  [
    'closed data object',
    "const step={type:'course'};external({...step});",
    true,
  ],
  [
    'closed object carrying database',
    'const step={database:platform.database};external({...step});',
    false,
  ],
  ['unknown object spread', 'external({...unknown});', false],
])(
  'distinguishes %s from a capability escape inside a service method',
  async (_name, prefix, expected) => {
    const source = factoryProviders.replace(
      'async list(){return',
      `async list(){${prefix}return`,
    );
    const result = await collectModuleSources(
      await fixture(routes, { 'server/providers/index.js': source }),
    );
    expect(
      (result.routes[0]?.apiProviders ?? []).includes('@nocobase/db'),
    ).toBe(expected);
  },
);

const localArrayMethods = ['map', 'filter', 'find', 'some', 'every'];
it.each(
  localArrayMethods.flatMap((method) => [
    [
      method,
      'direct array escape',
      '(tool,index,array)=>{external(array);return true;}',
    ],
    [
      method,
      'nested array escape',
      '(tool,index,array)=>{external({nested:[array]});return true;}',
    ],
    [
      method,
      'element overwrite',
      '(tool,index,array)=>{array[0].execute=external;return true;}',
    ],
    [
      method,
      'rest array escape',
      '(tool,...rest)=>{external(rest[1]);return true;}',
    ],
    [
      method,
      'arguments array escape',
      'function(tool){external(arguments[2]);return true;}',
    ],
  ]),
)('rejects %s callbacks with %s', async (method, _name, callback) => {
  const result = await collectModuleSources(
    await fixture(routes, {
      ...staticToolRegistry,
      [registryFile]: staticToolRegistry[registryFile].replace(
        'return {tools};',
        `[...tools.values()].${method}(${callback});return {tools};`,
      ),
    }),
  );
  expect(result.routes[0]?.apiProviders ?? []).not.toContain('@nocobase/db');
});

it.each(localArrayMethods)(
  'retains read-only two-parameter %s callbacks',
  async (method) => {
    const result = await collectModuleSources(
      await fixture(routes, {
        ...staticToolRegistry,
        [registryFile]: staticToolRegistry[registryFile].replace(
          'return {tools};',
          `[...tools.values()].${method}((tool,index)=>tool.definition.name);return {tools};`,
        ),
      }),
    );
    expect(result.routes[0]?.apiProviders).toContain('@nocobase/db');
  },
);

it('allows string keys to leave a local registry', async () => {
  const result = await collectModuleSources(
    await fixture(routes, {
      ...staticToolRegistry,
      [registryFile]: staticToolRegistry[registryFile].replace(
        'return {tools};',
        'external([...tools.keys()]);return {tools};',
      ),
    }),
  );
  expect(result.routes[0]?.apiProviders).toContain('@nocobase/db');
});
