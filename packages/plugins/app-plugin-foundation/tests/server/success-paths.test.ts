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

const registration = `import {Hono} from 'hono';
import {defineApiRoutes,describeRoute,apiValidator} from '@nocobase/app-server/router';
import {databaseManagerToken} from '@nocobase/db';
import {authenticationToken} from '@nocobase/app-plugin-authentication';
import {bodyLimit} from 'hono/body-limit';
import {z} from 'zod';
export default defineApiRoutes(app=>{
 const router=new Hono(); const child=new Hono();
 if(!app.container.has(databaseManagerToken)) {
   child.all('*', c=>c.text('unavailable',503));
   return router.route('/records',child);
 }
 const store=app.container.resolve(databaseManagerToken);
 const auth=app.container.resolve(authenticationToken);
 child.use('*', auth.required(),bodyLimit({maxSize:512}));
 child.get('/',describeRoute({summary:'Read records'}),apiValidator('query',z.object({})),c=>store.connection().repository('records').findMany());
 return router.route('/records',child);
});`;

async function fixture(server = registration, request = 'records') {
  const root = await mkdtemp(path.join(os.tmpdir(), 'foundation-success-'));
  roots.push(root);
  const files = {
    'package.json': JSON.stringify({ name: 'success-fixture' }),
    'client/routes.js': `export default [{name:'catalog',componentLoader:()=>import('./page.js')},{name:'home',componentLoader:()=>import('./home.js')}];`,
    'client/page.js': `import {useApiClient} from '@nocobase/app-client';export default ()=>{const api=useApiClient();return api.request({path:'${request}'});};`,
    'client/home.js': `export default ()=>null;`,
    'server/routes/index.js': server,
  };
  for (const [file, contents] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await writeFile(path.join(root, file), contents);
  }
  return root;
}

it('retains request provenance and all success conditions in source-free artifacts and cache hits', async () => {
  const root = await fixture();
  const direct = await collectModuleSources(root);
  const catalog = direct.routes.find((route) => route.routeName === 'catalog')!;
  expect(catalog.apiProviders).toContain('@nocobase/db');
  const evidence = catalog.apiEvidence!.find((item) =>
    item.providers.includes('@nocobase/db'),
  )!;
  expect(evidence).toMatchObject({ method: 'GET', path: '/records' });
  expect(evidence.conditions).toEqual([
    { kind: 'databaseAvailable', source: '@nocobase/db#databaseManagerToken' },
    {
      kind: 'authenticated',
      source:
        '@nocobase/app-plugin-authentication#authenticationToken.required',
    },
    { kind: 'bodyWithinLimit', source: 'hono/body-limit#bodyLimit' },
    { kind: 'validInput', source: '@nocobase/app-server/router#apiValidator' },
  ]);
  expect(
    direct.routes.find((route) => route.routeName === 'home')?.apiProviders,
  ).toBeUndefined();
  const cache = new ModuleSourceCache();
  const cold = await cache.read(root);
  expect(cold).toEqual(direct);
  expect(await cache.read(root)).toBe(cold);
  await writeModuleManifest(root);
  await writeFile(
    path.join(root, 'dist/package.json'),
    JSON.stringify({ name: 'success-fixture' }),
  );
  await rm(path.join(root, 'client'), { recursive: true });
  await rm(path.join(root, 'server'), { recursive: true });
  const built = await collectModuleSources(path.join(root, 'dist'));
  expect(built).toEqual(direct);
  const deployed = await cache.read(path.join(root, 'dist'));
  expect(deployed).toEqual(direct);
  expect(await cache.read(path.join(root, 'dist'))).toBe(deployed);
});

it.each([
  [
    'opaque setup before the availability guard',
    registration.replace(
      ' if(!app.container.has',
      ' opaqueSetup(app); if(!app.container.has',
    ),
  ],
  [
    'unknown middleware',
    registration.replace(
      "child.use('*',",
      "child.use('*',opaque()); child.use('*',",
    ),
  ],
  [
    'terminating overlap',
    registration.replace(
      'const child=new Hono();',
      "const child=new Hono(); router.get('/records',c=>c.text('cached'));",
    ),
  ],
  [
    'method mismatch',
    registration.replace("child.get('/',", "child.post('/',"),
  ],
  [
    'path mismatch',
    registration.replace("child.get('/',", "child.get('/other',"),
  ],
  [
    'dead registration',
    registration.replace(
      "child.get('/',",
      "return router.route('/records',new Hono()); child.get('/',",
    ),
  ],
  [
    'unproven availability',
    registration.replace(
      '!app.container.has(databaseManagerToken)',
      '!unknownAvailability',
    ),
  ],
  [
    'shadowed authentication service',
    registration.replace(
      'app.container.resolve(authenticationToken)',
      '({required:()=>opaque()})',
    ),
  ],
  [
    'untrusted validator import',
    registration
      .replace(
        'defineApiRoutes,describeRoute,apiValidator',
        'defineApiRoutes,describeRoute',
      )
      .replace(
        'import {bodyLimit}',
        "import {apiValidator} from 'untrusted'; import {bodyLimit}",
      ),
  ],
  [
    'unused service construction',
    registration.replace(
      "c=>store.connection().repository('records').findMany()",
      'c=>c.json({ok:true})',
    ),
  ],
  [
    'database-unavailable-only router',
    `import {Hono} from 'hono';import {defineApiRoutes} from '@nocobase/app-server/router';export default defineApiRoutes(app=>{const router=new Hono();router.all('/records',c=>c.text('unavailable',503));return router;});`,
  ],
])(
  'keeps the %s barrier without inventing a database association',
  async (_name, server) => {
    const sources = await collectModuleSources(await fixture(server));
    expect(
      sources.routes.find((route) => route.routeName === 'catalog')
        ?.apiProviders ?? [],
    ).not.toContain('@nocobase/db');
  },
);

it('distinguishes a direct unconditional handler from a successful guarded request', async () => {
  const sources = await collectModuleSources(
    await fixture(
      `import {Hono} from 'hono';import {read} from '@nocobase/db';export default new Hono().get('/records',()=>read());`,
    ),
  );
  expect(sources.routes[0]?.apiEvidence).toEqual([
    {
      method: 'GET',
      path: '/records',
      providers: ['@nocobase/db'],
      conditions: [],
    },
  ]);
});

it('separates framework root contributions from API paths without ignoring unknown API contributions', async () => {
  const roots = `import {defineRootRoutes} from '@nocobase/app-server/router'; const outside=defineRootRoutes(app=>new Hono().get('/records',c=>c.text('outside')));`;
  const app =
    registration.replace(
      'export default defineApiRoutes',
      'const api=defineApiRoutes',
    ) + '\nexport default [outside,api];';
  const source = await collectModuleSources(await fixture(roots + app));
  expect(source.routes[0]?.apiProviders).toContain('@nocobase/db');
  const unknown = await collectModuleSources(
    await fixture(
      (roots + app).replace('defineRootRoutes(app=>', 'unknownRoutes(app=>'),
    ),
  );
  expect(unknown.routes[0]?.apiProviders ?? []).not.toContain('@nocobase/db');
});

it('does not turn framework rejection callbacks into successful-handler dependencies', async () => {
  const source = registration
    .replace(
      "import {z} from 'zod';",
      "import {z} from 'zod';import {send} from '@nocobase/app-plugin-mail';",
    )
    .replace(
      'bodyLimit({maxSize:512})',
      'bodyLimit({maxSize:512,onError:c=>{send();return c.text("large",413)}})',
    );
  const result = await collectModuleSources(await fixture(source));
  expect(result.routes[0]?.apiProviders).toContain('@nocobase/db');
  expect(result.routes[0]?.apiProviders).not.toContain(
    '@nocobase/app-plugin-mail',
  );
});

it.each([
  { targets: ['./server/stop.js'] },
  { targets: ['./server/missing.js'] },
  { targets: ['./server/stop.js', './server/other.js'] },
])(
  'rejects a local bodyLimit override declared as $targets in source, cache and deployment',
  async ({ targets }) => {
    const root = await fixture();
    await writeFile(
      path.join(root, 'server/stop.js'),
      `export function bodyLimit(){return c=>c.text('stopped',403);}`,
    );
    const cache = new ModuleSourceCache();
    const genuine = await cache.read(root);
    expect(genuine.routes[0]?.apiProviders).toContain('@nocobase/db');
    await writeFile(
      path.join(root, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: { paths: { 'hono/body-limit': targets } },
      }),
    );
    const direct = await collectModuleSources(root);
    expect(direct.routes[0]?.apiProviders ?? []).not.toContain('@nocobase/db');
    expect(JSON.stringify(direct)).not.toContain('hono/body-limit#bodyLimit');
    const changed = await cache.read(root);
    expect(changed).toEqual(direct);
    expect(changed).not.toBe(genuine);
    expect(await cache.read(root)).toBe(changed);
    await writeModuleManifest(root);
    await writeFile(
      path.join(root, 'dist/package.json'),
      JSON.stringify({ name: 'success-fixture' }),
    );
    await rm(path.join(root, 'client'), { recursive: true });
    await rm(path.join(root, 'server'), { recursive: true });
    const deployed = await cache.read(path.join(root, 'dist'));
    expect(deployed).toEqual(direct);
    expect(await collectModuleSources(path.join(root, 'dist'))).toEqual(direct);
    expect(await cache.read(path.join(root, 'dist'))).toBe(deployed);
  },
);

it('recovers the genuine framework contract when a local override is removed', async () => {
  const root = await fixture();
  const config = path.join(root, 'tsconfig.json');
  await writeFile(
    config,
    JSON.stringify({
      compilerOptions: { paths: { 'hono/body-limit': ['./missing.js'] } },
    }),
  );
  const cache = new ModuleSourceCache();
  const unknown = await cache.read(root);
  expect(unknown.routes[0]?.apiProviders ?? []).not.toContain('@nocobase/db');
  await rm(config);
  const recovered = await cache.read(root);
  expect(recovered.routes[0]?.apiProviders).toContain('@nocobase/db');
  expect(recovered).not.toBe(unknown);
  expect(await cache.read(root)).toBe(recovered);
});
