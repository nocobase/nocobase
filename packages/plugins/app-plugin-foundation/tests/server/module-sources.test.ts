import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { collectModuleSources } from '../../server/module-sources.js';

const directories: string[] = [];
async function fixture(files: Record<string, string>): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'foundation-modules-'));
  directories.push(root);
  for (const [name, source] of Object.entries({
    'package.json': JSON.stringify({
      name: 'arbitrary-app',
      imports: { '#parts/*': './client/parts/*.js' },
    }),
    ...files,
  })) {
    const file = path.join(root, name);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, source);
  }
  return root;
}
afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((root) => rm(root, { force: true, recursive: true })),
  );
});

describe('static module dependencies', () => {
  it('keeps API client bindings scoped and excludes an unreferenced router', async () => {
    const root = await fixture({
      'client/routes.ts': `export default [{name:'page',componentLoader:()=>import('./page.js')}];`,
      'client/page.ts': `import {useApiClient} from '@nocobase/app-client'; export default ()=>{const api=useApiClient(); api.request({path:'read'}); const other=()=>{const api={request(){}}; api.request({path:'write'});}; other();};`,
      'server/routes/index.ts': `import {Hono} from 'hono'; import {read} from '@nocobase/db'; import unused from './unused.js'; const router=new Hono(); router.get('/read',()=>read()); export default new Hono().route('/',router);`,
      'server/routes/unused.ts': `import {Hono} from 'hono'; import {send} from '@nocobase/app-plugin-notification/server'; const router=new Hono(); router.get('/write',()=>send()); export default new Hono().route('/',router);`,
    });
    expect((await collectModuleSources(root)).routes[0]?.apiProviders).toEqual([
      '@nocobase/db',
    ]);
  });

  it('follows selected exports through barrels and excludes unused helpers, imports and side effects', async () => {
    const root = await fixture({
      'client/routes.ts': `export default [{name:'page',componentLoader:()=>import('./page.js')}];`,
      'client/page.ts': `import './page.css'; import {Visible} from './barrel.js'; import {Unused} from '@nocobase/app-plugin-knowledge/client'; import '@nocobase/app-plugin-agents/client'; export default ()=>Visible();`,
      'client/page.css': '.page { color: red }',
      'client/barrel.ts': `export {Visible} from './shared.js'; export {Other} from './other.js';`,
      'client/shared.ts': `import {FileList} from '@nocobase/app-plugin-file/client'; import {send} from '@nocobase/app-plugin-notification/client'; export const Visible=()=>FileList(); export const Hidden=()=>send();`,
      'client/other.ts': `import {jobs} from '@nocobase/app-server/jobs'; export const Other=()=>jobs();`,
    });
    expect((await collectModuleSources(root)).routes[0]).toMatchObject({
      providers: ['@nocobase/app-plugin-file'],
      complete: true,
    });
  });

  it('attributes only the matching endpoint handlers, never the other endpoints in the same router', async () => {
    const root = await fixture({
      'client/routes.ts': `export default [{name:'page',componentLoader:()=>import('./page.js')}];`,
      'client/page.ts': `import {useApiClient} from '@nocobase/app-client'; export default ()=>{const api=useApiClient(); return api.request({path:'items'});};`,
      'server/routes/index.ts': `import {Hono} from 'hono'; import {read, approve} from './shared.js'; const router=new Hono(); router.get('/items',()=>read()); router.post('/items',()=>approve()); export default ()=>new Hono().route('/',router);`,
      'server/routes/shared.ts': `import {repository} from '@nocobase/db'; import {transition} from '@nocobase/lifecycle'; import {send} from '@nocobase/app-plugin-notification/server'; export const read=()=>repository(); export const approve=()=>{transition(); send();};`,
    });
    expect((await collectModuleSources(root)).routes[0]?.apiProviders).toEqual([
      '@nocobase/db',
    ]);
  });

  it('does not borrow requests from an unused exported hook or providers from an unused class method', async () => {
    const root = await fixture({
      'client/routes.ts': `export default [{name:'page',componentLoader:()=>import('./page.js')}];`,
      'client/page.ts': `import {format} from './helpers.js'; export default ()=>format();`,
      'client/helpers.ts': `import {useApiClient} from '@nocobase/app-client'; export const format=()=>''; export function unrelated(){const api=useApiClient(); return api.request({path:'items'});}`,
      'server/routes/index.ts': `import {Hono} from 'hono'; import {repository} from '@nocobase/db'; const router=new Hono(); router.get('/items',()=>repository()); export default new Hono().route('/',router);`,
    });
    expect(
      (await collectModuleSources(root)).routes[0]?.apiProviders,
    ).toBeUndefined();
    await writeFile(
      path.join(root, 'client/page.ts'),
      `import {Service} from './service.js'; export default ()=>new Service().read();`,
    );
    await writeFile(
      path.join(root, 'client/service.ts'),
      `import {read} from '@nocobase/db'; import {send} from '@nocobase/app-plugin-notification/client'; export class Service{read(){return read();} unused(){return send();}}`,
    );
    expect((await collectModuleSources(root)).routes[0]?.providers).toEqual([
      '@nocobase/db',
    ]);
  });

  it('distinguishes read and write dependencies on the same API path and withholds computed methods', async () => {
    const root = await fixture({
      'client/routes.ts': `export default [{name:'page',componentLoader:()=>import('./page.js')}];`,
      'client/page.ts': `import { useApiClient } from '@nocobase/app-client'; export default function Page(){const api=useApiClient(); api.request({path:'items/one?sort=id'});}`,
      'server/routes/index.ts': `import read from './read.js'; import write from './write.js'; export default [read,write];`,
      'server/routes/read.ts': `import {Hono} from 'hono'; import {readItem} from '@nocobase/db'; const read=new Hono(); read.get('/items/:id',()=>readItem()); export default new Hono().route('/',read);`,
      'server/routes/write.ts': `import {Hono} from 'hono'; import {transition} from '@nocobase/lifecycle'; const write=new Hono(); write.post('/items/:id',()=>transition()); export default new Hono().route('/',write);`,
    });
    expect((await collectModuleSources(root)).routes[0]?.apiProviders).toEqual([
      '@nocobase/db',
    ]);
    await writeFile(
      path.join(root, 'client/page.ts'),
      `import {useApiClient} from '@nocobase/app-client'; export default function Page(){const api=useApiClient(); api.request({method:'POST',path:'items/one'});}`,
    );
    expect((await collectModuleSources(root)).routes[0]?.apiProviders).toEqual([
      '@nocobase/lifecycle',
    ]);
    await writeFile(
      path.join(root, 'client/page.ts'),
      `import {useApiClient} from '@nocobase/app-client'; export default function Page(){const api=useApiClient(); api.request({method:unknownMethod,path:'items/one'});}`,
    );
    expect(
      (await collectModuleSources(root)).routes[0]?.apiProviders,
    ).toBeUndefined();
  });
  it('connects explicit API-client calls to root-mounted API dependencies without guessing from page names', async () => {
    const root = await fixture({
      'client/routes.ts': `export default [{name:'unrelated-name',componentLoader:()=>import('./page.js')}];`,
      'client/page.ts': `import {useApiClient} from '@nocobase/app-client'; export default function Page(){const api=useApiClient(); api.request({method:'POST',path:\`orders/\${id}/approve\`}); const fake={request(){}}; fake.request({path:'unrelated'}); }`,
      'server/routes/index.ts': `import { Hono } from 'hono'; import {approve} from './service.js'; const router=new Hono(); router.post('/orders/:id/approve',()=>approve()); export default ()=>new Hono().route('/',router);`,
      'server/routes/service.ts': `import {repository} from '@nocobase/db'; import {transition} from '@nocobase/lifecycle'; export function approve(){return transition(repository);}`,
    });
    expect((await collectModuleSources(root)).routes[0]).toMatchObject({
      packageName: 'arbitrary-app',
      routeName: 'unrelated-name',
      apiProviders: ['@nocobase/db', '@nocobase/lifecycle'],
    });
    await writeFile(
      path.join(root, 'client/page.ts'),
      `import {useApiClient} from '@nocobase/app-client'; export default function Page(){const api=useApiClient(); api.request({path:\`orders/\${id}/other\`});}`,
    );
    expect(
      (await collectModuleSources(root)).routes[0]?.apiProviders,
    ).toBeUndefined();
  });
  it('follows page imports, aliases, exports and cycles without executing app code or including type-only references', async () => {
    const root = await fixture({
      'client/routes.ts': `throw new Error('must not execute'); export default [{ name: 'arbitrary-renamed-page', componentLoader: () => import('./pages/work.js') }];`,
      'client/pages/work.tsx': `import { Widget } from '#parts/widget'; import type { Model } from '@type/unused'; import { type Other } from '@type/also-unused'; import {extend} from '@vendor/pro-extension/client'; export default function Page(){extend(); return Widget();};`,
      'client/parts/widget.ts': `export { Widget } from './cycle.js'; export { type Model } from '@type/reexport-only';`,
      'client/parts/cycle.ts': `import './widget.js'; import {FileList} from '@nocobase/app-plugin-file/client'; import '@nocobase/app-server/router'; export const Widget = () => FileList();`,
    });
    const sources = await collectModuleSources(root);
    expect(sources).toEqual({
      complete: true,
      routes: [
        {
          packageName: 'arbitrary-app',
          routeName: 'arbitrary-renamed-page',
          providers: ['@nocobase/app-plugin-file', '@vendor/pro-extension'],
          complete: true,
        },
      ],
    });
    expect(JSON.stringify(sources)).not.toContain(root);
    await writeFile(path.join(root, 'client/routes.ts'), `export default [];`);
    expect((await collectModuleSources(root)).routes).toEqual([]);
  });

  it('withholds stale dependency evidence for an overridden page', async () => {
    const root = await fixture({
      'client/routes.ts': `export default [{name:'page',componentLoader:()=>import('./old.js')}];`,
      'client/old.tsx': `import '@nocobase/app-plugin-file/client'; export default () => null;`,
      'client/route-overrides.ts': `export default [{routeId:'arbitrary-app:page',componentLoader:()=>import('./new.js')}];`,
      'client/new.tsx': `export default () => null;`,
    });
    expect((await collectModuleSources(root)).routes).toEqual([
      {
        packageName: 'arbitrary-app',
        routeName: 'page',
        providers: [],
        complete: false,
      },
    ]);
  });

  it('reads installed compiled plugin sources from registered package roots, not only app dependencies', async () => {
    const root = await fixture({ 'client/routes.ts': 'export default [];' });
    const plugin = await fixture({
      'package.json': '{"name":"@vendor/pro"}',
      'dist/client/routes.js': `export default [{name:'proPage',componentLoader:()=>import('./page.js')}];`,
      'dist/client/page.js': `import {repository} from '@nocobase/db'; export default () => repository();`,
    });
    const sources = await collectModuleSources(root, [
      { name: '@vendor/pro', rootDir: plugin, evidence: 'serverRegistration' },
    ]);
    expect(sources.routes).toContainEqual({
      packageName: '@vendor/pro',
      routeName: 'proPage',
      providers: ['@nocobase/db'],
      complete: true,
    });
  });

  it('keeps unreadable, escaping and symlinked dependencies unknown without leaking paths or failures', async () => {
    const outside = await fixture({
      'secret.ts': `import '@secret/provider';`,
    });
    const root = await fixture({
      'client/routes.ts': `export default [{name:'page',componentLoader:()=>import('./page.js')}];`,
      'client/page.ts': `import {missing} from './missing.js'; import {linked} from './linked.js'; import {secret} from '../../secret.js'; import {known} from '@known/provider'; export default ()=>[missing(), linked(), secret(), known()];`,
    });
    await symlink(
      path.join(outside, 'secret.ts'),
      path.join(root, 'client/linked.ts'),
    );
    const sources = await collectModuleSources(root);
    expect(sources.routes[0]).toMatchObject({
      providers: ['@known/provider'],
      complete: false,
    });
    expect(JSON.stringify(sources)).not.toContain('secret');
    expect(await collectModuleSources(path.join(root, 'missing'))).toEqual({
      routes: [],
      complete: false,
    });
  });
});
