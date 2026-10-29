import {
  mkdtemp,
  mkdir,
  writeFile,
  rm,
  symlink,
  readFile,
  stat,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import ts from 'typescript';

import { businessModules } from '../../client/business-modules.js';
import { writeModuleManifest } from '../../server/module-manifest.js';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
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
    await writeFile(
      file,
      name.startsWith('dist/') && name.endsWith('.js')
        ? ts.transpileModule(source, {
            compilerOptions: {
              target: ts.ScriptTarget.ES2022,
              module: ts.ModuleKind.ESNext,
            },
          }).outputText
        : source,
    );
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
  it.each(['local', 'property', 'parameter', 'nested', 'imported'])(
    'resolves %s child route references with invocation-local bindings',
    async (kind) => {
      const child = `{name:\`\${name}-child\`,componentLoader:loader}`;
      const bodies: Record<string, string> = {
        local: `const children=[${child}];return {name,componentLoader:list,children};`,
        property: `const config={children:[${child}]};return {name,componentLoader:list,children:config.children};`,
        parameter: `return {name,componentLoader:list,children:options.children};`,
        nested: `const leaf=${child};const children=[{name:\`\${name}-group\`,children:[leaf]}];return {name,componentLoader:list,children};`,
        imported: `return {name,componentLoader:list,children:children(name,loader)};`,
      };
      const root = await fixture({
        'client/routes.ts': `import {children} from './children.js';function master({name,list,loader,options}){${bodies[kind]}}export default [master({name:'one',list:()=>import('./quiet.js'),loader:()=>import('./page.js')${kind === 'parameter' ? ",options:{children:[{name:'one-child',componentLoader:()=>import('./page.js')}]}" : ''}}),master({name:'two',list:()=>import('./quiet.js'),loader:()=>import('./quiet.js')${kind === 'parameter' ? ",options:{children:[{name:'two-child',componentLoader:()=>import('./quiet.js')}]}" : ''}})];`,
        'client/children.ts': `export const children=(name,loader)=>[{name:\`\${name}-child\`,componentLoader:loader}];`,
        'client/page.ts': `import {read} from '@nocobase/db';export default ()=>read();`,
        'client/quiet.ts': `export default ()=>null;`,
      });
      const result = await collectModuleSources(root);
      expect(result.routes.map((route) => route.routeName)).toEqual([
        'one',
        'one-child',
        'two',
        'two-child',
      ]);
      expect(result.routes[1]?.providers).toEqual(['@nocobase/db']);
      expect(result.routes[3]?.providers).toEqual([]);
      expect(result.complete).toBe(true);
      const modules = businessModules(
        result.routes.map(({ routeName: name }) => ({
          id: `app:${name}`,
          name,
          packageName: 'arbitrary-app',
          source: 'application',
          path: `/${name}`,
          auth: 'required',
          authz: 'skip',
          navigation: { title: name },
          componentLoader: async () => ({ default: () => null }),
        })),
        {
          complete: true,
          unreadable: [],
          entries: [
            {
              name: '@nocobase/db',
              version: 'fixture',
              installed: true,
              kind: 'core',
              origin: 'nocobase',
              categories: ['dataModeling'],
              registration: 'observed',
              evidence: ['serverRegistration'],
            },
          ],
        },
        result,
        ['interface', 'dataModeling'],
      );
      expect(
        modules
          .filter((module) =>
            module.links.some((link) => link.capability === 'dataModeling'),
          )
          .map((module) => module.id),
      ).toEqual(['app:one-child']);
    },
  );

  it.each(['children', 'returned', 'property', 'cycle', 'noReturn'])(
    'keeps proven routes and marks unknown %s route values incomplete',
    async (kind) => {
      const calls: Record<string, string> = {
        children: `const master=({children})=>({name:'parent',componentLoader:()=>import('./quiet.js'),children});export default [master({children:[{name:'child',componentLoader:()=>import('./page.js')},unknown]})];`,
        returned: `const master=()=>unknown;export default [{name:'parent',componentLoader:()=>import('./quiet.js')},master()];`,
        property: `const master=()=>unknown.routes;export default [{name:'parent',componentLoader:()=>import('./quiet.js')},master()];`,
        cycle: `const children=[children];const master=()=>({name:'parent',componentLoader:()=>import('./quiet.js'),children});export default [master()];`,
        noReturn: `const master=()=>{};export default [{name:'parent',componentLoader:()=>import('./quiet.js')},master()];`,
      };
      const root = await fixture({
        'client/routes.ts': calls[kind],
        'client/page.ts': `import {read} from '@nocobase/db';export default ()=>read();`,
        'client/quiet.ts': `export default ()=>null;`,
      });
      const result = await collectModuleSources(root);
      expect(result.routes.map((route) => route.routeName)).toEqual(
        kind === 'children' ? ['parent', 'child'] : ['parent'],
      );
      expect(result.complete).toBe(false);
    },
  );

  it.each([
    'own',
    'decoy',
    'missing',
    'inherited',
    'baseUrl',
    'renamed',
    'typeElement',
    'typeStatement',
  ])(
    'uses the declared paths directory with %s inherited configuration',
    async (kind) => {
      const root = await fixture({
        'tsconfig.json': JSON.stringify({
          extends: './config/base.json',
          ...(kind === 'inherited'
            ? {}
            : { compilerOptions: { paths: { '@/*': ['./client/*'] } } }),
        }),
        'config/base.json': JSON.stringify({
          compilerOptions: {
            strict: true,
            ...(kind === 'inherited'
              ? { paths: { '@/*': ['../client/*'] } }
              : {}),
            ...(kind === 'baseUrl' ? { baseUrl: '..' } : {}),
          },
        }),
        'client/routes.ts': `export default [{name:'page',componentLoader:()=>import('./page.js')}];`,
        'client/page.ts': `import {${kind === 'renamed' ? 'selected as read' : 'read'}} from '@/helper';export default ()=>read();`,
        ...(kind === 'missing'
          ? {}
          : {
              'client/helper.ts': `import {read} from '@nocobase/db';import {send} from '@nocobase/app-plugin-mail/client';export ${kind === 'typeStatement' ? 'type ' : ''}{${kind === 'typeElement' ? 'type ' : ''}read${kind === 'renamed' ? ' as selected' : ''}};`,
            }),
        ...(kind === 'decoy' || kind === 'missing'
          ? {
              'config/client/helper.ts': `import {send} from '@nocobase/app-plugin-mail/client';export const read=()=>send();`,
            }
          : {}),
      });
      const result = await collectModuleSources(root);
      expect(result.routes[0]?.providers).toEqual(
        kind === 'missing' || kind.startsWith('type') ? [] : ['@nocobase/db'],
      );
      expect(result.complete).toBe(kind !== 'missing');
      const parsed = ts.getParsedCommandLineOfConfigFile(
        path.join(root, 'tsconfig.json'),
        {},
        { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => {} },
      );
      const resolved = ts.resolveModuleName(
        '@/helper',
        path.join(root, 'client/page.ts'),
        parsed!.options,
        ts.sys,
      ).resolvedModule;
      expect(resolved?.resolvedFileName).toBe(
        kind === 'missing' ? undefined : path.join(root, 'client/helper.ts'),
      );
    },
  );

  it('resolves explicitly configured package-local aliases through request hooks', async () => {
    const root = await fixture({
      'tsconfig.json': JSON.stringify({
        compilerOptions: { baseUrl: '.', paths: { '@/*': ['./client/*'] } },
      }),
      'client/routes.ts': `export default [{name:'items',componentLoader:()=>import('./page.js')}];`,
      'client/page.ts': `import {useItems,ITEMS} from '@/lib/helper'; export default ()=>useItems(ITEMS);`,
      'client/lib/helper.ts': `import {useService,apiClientToken} from '@nocobase/app-client'; import {useQuery} from '@tanstack/react-query'; export const ITEMS='items';export function useItems(path){const api=useService(apiClientToken);return useQuery({queryKey:[path],queryFn:()=>api.request({path})});}`,
      'server/routes/index.ts': `import {Hono} from 'hono';import {read} from '@nocobase/db';export default new Hono().get('/items',()=>read());`,
    });
    expect((await collectModuleSources(root)).routes[0]).toMatchObject({
      apiProviders: ['@nocobase/db'],
      complete: true,
    });
    expect(
      (await collectModuleSources(root)).routes[0]?.providers,
    ).not.toContain('@/lib');
  });

  it.each(['', 'dist/'])(
    'instantiates %s finite local master factories and keeps each loader paired with its name',
    async (prefix) => {
      const root = await fixture({
        [prefix + 'client/routes.js']:
          `import {defineAppRoutes as routes} from '@nocobase/app-client/plugins';import {master} from './master.js';export default routes([master({file:'items',list:()=>import('./items.js'),detail:()=>import('./detail.js'),tabs:[{path:'audit',loader:()=>import('./audit.js') }]}),master({file:'other',list:()=>import('./other.js')})]);`,
        [prefix + 'client/master.js']:
          `const history=()=>import('./history.js');const landing=(name,loader)=>loader?[{name:\`\${name}-landing\`,componentLoader:loader}]:[];export const master=({file,list,detail=list,tabs=[]})=>({name:file,componentLoader:list,children:[{name:\`\${file}-detail\`,componentLoader:detail,children:[...landing(file,history),...tabs.map(tab=>({name:\`\${file}-\${tab.path}\`,componentLoader:tab.loader}))]}]});`,
        [prefix + 'client/items.js']:
          `import {read} from '@nocobase/db';export default ()=>read();`,
        [prefix + 'client/detail.js']:
          `import {read} from '@nocobase/db';export default ()=>read();`,
        [prefix + 'client/history.js']: `export default ()=>null;`,
        [prefix + 'client/audit.js']:
          `import {send} from '@nocobase/app-plugin-mail/client';export default ()=>send();`,
        [prefix + 'client/other.js']: `export default ()=>null;`,
      });
      const result = await collectModuleSources(root);
      expect(result.routes.map((r) => r.routeName)).toEqual([
        'items',
        'items-detail',
        'items-landing',
        'items-audit',
        'other',
        'other-detail',
        'other-landing',
      ]);
      expect(
        result.routes.find((r) => r.routeName === 'items-audit')?.providers,
      ).toEqual(['@nocobase/app-plugin-mail']);
      expect(
        result.routes.find((r) => r.routeName === 'other')?.providers,
      ).toEqual([]);
      expect(result.complete).toBe(true);
    },
  );

  it.each(['relative', 'hash', 'configured', 'inherited'])(
    'keeps %s request method/path pairs, unused imports and final matrix links precise',
    async (kind) => {
      const specifier =
        kind === 'relative'
          ? './helper.js'
          : kind === 'hash'
            ? '#helper'
            : '@/helper';
      const root = await fixture({
        'package.json': JSON.stringify({
          name: 'arbitrary-app',
          imports: { '#helper': './client/helper.js' },
        }),
        'tsconfig.json': JSON.stringify(
          kind === 'inherited'
            ? { extends: './config/base.json' }
            : { compilerOptions: { paths: { '@/*': ['./client/*'] } } },
        ),
        'config/base.json': JSON.stringify({
          compilerOptions: { baseUrl: '..', paths: { '@/*': ['./client/*'] } },
        }),
        'client/routes.ts': `const master=({file,list})=>({name:file,componentLoader:list});export default [master({file:'items',list:()=>import('./page.js')}),{name:'quiet',componentLoader:()=>import('./quiet.js')}];`,
        'client/page.ts': `import {useRead} from '${specifier}';import {unused} from '@vendor/unused';export default ()=>{useRead('items');useRead('audit','POST');};`,
        'client/quiet.ts': `export default ()=>null;`,
        'client/helper.ts': `import {useService,apiClientToken} from '@nocobase/app-client';import {useQuery} from '@tanstack/react-query';import {read} from '@vendor/extra';export const unused=()=>read();export function useRead(path,method='GET'){const api=useService(apiClientToken);return useQuery({queryKey:[path,method],queryFn:()=>api.request({path,method})});}`,
        'server/routes/index.ts': `import {Hono} from 'hono';import {read} from '@nocobase/db';import {send} from '@nocobase/app-plugin-mail/server';export default new Hono().get('/items',()=>read()).post('/items',()=>send()).post('/audit',()=>read());`,
      });
      const sources = await collectModuleSources(root);
      expect(sources.routes[0]).toMatchObject({
        apiProviders: ['@nocobase/db'],
        complete: true,
      });
      expect(sources.routes[0]?.providers).not.toContain('@vendor/unused');
      expect(sources.routes[0]?.providers).not.toContain('@vendor/extra');
      const navigation = (name: string): AppClientRegisteredRoute => ({
        id: `app:${name}`,
        name,
        packageName: 'arbitrary-app',
        source: 'application',
        path: `/${name}`,
        auth: 'required',
        authz: 'skip',
        navigation: { title: name },
        componentLoader: async () => ({ default: () => null }),
      });
      const modules = businessModules(
        [navigation('items'), navigation('quiet')],
        {
          complete: true,
          unreadable: [],
          entries: [
            {
              name: '@nocobase/db',
              version: '1',
              installed: true,
              kind: 'core',
              origin: 'nocobase',
              categories: ['dataModeling'],
              registration: 'observed',
              evidence: ['serverRegistration'],
            },
          ],
        },
        sources,
        ['interface', 'dataModeling'],
      );
      expect(
        modules[0]?.links.find((link) => link.capability === 'dataModeling'),
      ).toMatchObject({ evidence: ['apiSource'], providers: ['@nocobase/db'] });
      expect(modules[1]?.links.map((link) => link.capability)).toEqual([
        'interface',
      ]);
      await writeModuleManifest(root);
      const artifact = path.join(root, 'dist/server/foundation-modules.json');
      const first = await readFile(artifact, 'utf8'),
        mtime = (await stat(artifact)).mtimeMs;
      await writeModuleManifest(root);
      expect(await readFile(artifact, 'utf8')).toBe(first);
      expect((await stat(artifact)).mtimeMs).toBe(mtime);
      await writeFile(
        path.join(root, 'dist/package.json'),
        JSON.stringify({ name: 'arbitrary-app' }),
      );
      expect(await collectModuleSources(path.join(root, 'dist'))).toEqual(
        sources,
      );
    },
  );

  it.each(['missing', 'multiple', 'escape', 'cycle', 'oversized', 'symlink'])(
    'keeps an %s alias unresolved and incomplete without inventing a provider',
    async (kind) => {
      const root = await fixture({
        'tsconfig.json': JSON.stringify({
          ...(kind === 'cycle' ? { extends: './tsconfig.json' } : {}),
          compilerOptions: {
            paths: {
              '@/*':
                kind === 'multiple'
                  ? ['./client/*', './else/*']
                  : kind === 'escape'
                    ? ['../*']
                    : ['./client/*'],
            },
          },
        }),
        'client/routes.ts': `export default [{name:'items',componentLoader:()=>import('./page.js')}];`,
        'client/page.ts': `import {read} from '@/helper';import {read as external} from '@vendor/pkg';export default ()=>{read();external();};`,
        'client/helper.ts': `import {query} from '@nocobase/db';export function read(){return query();}`,
      });
      if (kind === 'missing') await rm(path.join(root, 'tsconfig.json'));
      if (kind === 'oversized')
        await writeFile(path.join(root, 'tsconfig.json'), ' '.repeat(512001));
      if (kind === 'symlink') {
        const other = await fixture({
          'helper.ts': `import {query} from '@nocobase/db';export function read(){return query();}`,
        });
        await rm(path.join(root, 'client/helper.ts'));
        await symlink(
          path.join(other, 'helper.ts'),
          path.join(root, 'client/helper.ts'),
        );
      }
      const result = await collectModuleSources(root);
      expect(result.routes[0]).toMatchObject({
        providers: ['@vendor/pkg'],
        complete: false,
      });
      expect(result.complete).toBe(false);
    },
  );

  it('isolates alias configuration between an application and a registered plugin, including local import cycles', async () => {
    const root = await fixture({
      'tsconfig.json': JSON.stringify({
        compilerOptions: { paths: { '@/*': ['./client/*'] } },
      }),
      'client/routes.ts': `export default [{name:'host',componentLoader:()=>import('./page.js')}];`,
      'client/page.ts': `import {read} from '@/helper';export default ()=>read();`,
      'client/helper.ts': `import {query} from '@nocobase/db';export function read(){return query();}`,
    });
    const plugin = await fixture({
      'package.json': JSON.stringify({ name: 'other-plugin' }),
      'client/routes.ts': `export default [{name:'plugin',componentLoader:()=>import('./page.js')}];`,
      'client/page.ts': `import {read} from '@/helper';export default ()=>read();`,
    });
    const result = await collectModuleSources(root, [
      { name: 'other-plugin', rootDir: plugin, evidence: 'serverRegistration' },
    ]);
    expect(result.routes.find((r) => r.routeName === 'host')).toMatchObject({
      providers: ['@nocobase/db'],
      complete: true,
    });
    expect(result.routes.find((r) => r.routeName === 'plugin')).toMatchObject({
      providers: [],
      complete: false,
    });
    await writeFile(
      path.join(root, 'client/helper.ts'),
      `import './page.js';import {query} from '@nocobase/db';export function read(){return query();}`,
    );
    expect((await collectModuleSources(root)).routes[0]).toMatchObject({
      providers: ['@nocobase/db'],
      complete: true,
    });
  });

  it.each([
    'opaque',
    'recursive',
    'sideEffect',
    'constEffect',
    'duplicates',
    'loop',
    'unknownMap',
    'cyclicMap',
    'tooMany',
  ])(
    'retains known routes beside an unsupported %s factory without executing it',
    async (kind) => {
      const expressions = {
        cyclicMap: `cyclic.map(value=>({name:'invented',componentLoader:()=>import('./page.js')}))`,
        opaque: `unknownFactory({})`,
        recursive: `recurse({})`,
        sideEffect: `effect({})`,
        constEffect: `constEffect()`,
        duplicates: `({name:'invented',name:'other',componentLoader:()=>import('./page.js')})`,
        loop: `loop({})`,
        unknownMap: `unknown.map(x=>({name:x,componentLoader:()=>import('./page.js')}))`,
        tooMany: `Array.from({length:1000}).map(x=>({name:x,componentLoader:()=>import('./page.js')}))`,
      };
      const root = await fixture({
        'client/routes.ts': `const cyclic=[...cyclic];function constEffect(){const x=(globalThis.__foundationSideEffect=true);return {name:'invented',componentLoader:()=>import('./page.js')}}function recurse(value){return recurse(value)}function effect(){globalThis.__foundationSideEffect=true;fetch('https://invalid.test');return {name:'invented',componentLoader:()=>import('./page.js')}}function loop(){while(true){}return {name:'invented',componentLoader:()=>import('./page.js')}}export default [{name:'known',componentLoader:()=>import('./page.js')},${expressions[kind as keyof typeof expressions]}];`,
        'client/page.ts': `export default ()=>null;`,
      });
      const result = await collectModuleSources(root);
      expect(result.routes.map((r) => r.routeName)).toEqual(['known']);
      expect(result.routes[0]?.complete).toBe(true);
      expect(result.complete).toBe(false);
      expect(Reflect.get(globalThis, '__foundationSideEffect')).toBeUndefined();
    },
  );

  it('evaluates finite object tabs, literal find and default landing helpers with per-call bindings', async () => {
    const root = await fixture({
      'client/routes.ts': `const landing=(name,loader)=>loader?[{name:\`\${name}-landing\`,componentLoader:loader}]:[];const master=({file,list,tabs=[],open})=>({name:file,componentLoader:list,children:[...landing(file,tabs.find(t=>t.path===open)?.loader),...tabs.map(t=>({name:\`\${file}-\${t.path}\`,componentLoader:t.loader}))]});const objectTabs=(name,tabs)=>({name,componentLoader:()=>import('./quiet.js'),children:Object.entries(tabs).map(([tab,loader])=>({name:\`\${name}-\${tab}\`,componentLoader:loader}))});export default [master({file:'one',list:()=>import('./quiet.js'),open:'audit',tabs:[{path:'audit',loader:()=>import('./mail.js')}]}),objectTabs('two',{audit:()=>import('./mail.js'),quiet:()=>import('./quiet.js')})];`,
      'client/quiet.ts': `export default ()=>null;`,
      'client/mail.ts': `import {send} from '@nocobase/app-plugin-mail/client';export default ()=>send();`,
    });
    const result = await collectModuleSources(root);
    expect(result.routes.map((r) => r.routeName)).toEqual([
      'one',
      'one-landing',
      'one-audit',
      'two',
      'two-audit',
      'two-quiet',
    ]);
    expect(
      result.routes
        .filter((r) => r.providers.includes('@nocobase/app-plugin-mail'))
        .map((r) => r.routeName),
    ).toEqual(['one-landing', 'one-audit', 'two-audit']);
    expect(result.complete).toBe(true);
  });

  it('bounds alias-driven source reads without completing a truncated graph', async () => {
    const files: Record<string, string> = {
      'tsconfig.json': JSON.stringify({
        compilerOptions: { paths: { '@/*': ['./client/*'] } },
      }),
      'client/routes.ts': `export default [{name:'items',componentLoader:()=>import('./page.js')}];`,
      'client/page.ts':
        Array.from(
          { length: 2001 },
          (_, i) => `import {v${i}} from '@/v${i}';`,
        ).join('') +
        `export default ()=>[${Array.from({ length: 2001 }, (_, i) => `v${i}`).join(',')}];`,
    };
    for (let i = 0; i < 2001; i++)
      files[`client/v${i}.ts`] = `export const v${i}=${i};`;
    const result = await collectModuleSources(await fixture(files));
    expect(result.routes[0]).toMatchObject({ providers: [], complete: false });
    expect(result.complete).toBe(false);
  });

  it.each([
    'duplicates',
    'configSymlink',
    'inheritanceLimit',
    'unknownBranch',
    'spread',
  ])(
    'rejects %s ambiguity while retaining independent route evidence',
    async (kind) => {
      const files: Record<string, string> = {
        'tsconfig.json':
          kind === 'duplicates'
            ? `{"compilerOptions":{"paths":{"@/*":["./client/*"],"@/*":["./other/*"]}}}`
            : JSON.stringify({
                compilerOptions: { paths: { '@/*': ['./client/*'] } },
              }),
        'client/routes.ts': `const master=({name='invented',list})=>({name,componentLoader:list});export default [{name:'known',componentLoader:()=>import('./quiet.js')},{name:'alias',componentLoader:()=>import('./page.js')},${kind === 'unknownBranch' ? `opaqueCondition?master({name:'maybe',list:()=>import('./quiet.js')}):[]` : kind === 'spread' ? `master({...unknown,list:()=>import('./quiet.js')})` : '[]'}];`,
        'client/quiet.ts': `export default ()=>null;`,
        'client/page.ts': `import {read} from '@/helper';export default ()=>read();`,
        'client/helper.ts': `import {query} from '@nocobase/db';export const read=()=>query();`,
      };
      if (kind === 'inheritanceLimit') {
        files['tsconfig.json'] = JSON.stringify({ extends: './config0.json' });
        for (let i = 0; i < 9; i++)
          files[`config${i}.json`] = JSON.stringify({
            extends: `./config${i + 1}.json`,
            compilerOptions: { paths: { '@/*': ['./client/*'] } },
          });
      }
      const root = await fixture(files);
      if (kind === 'configSymlink') {
        const other = await fixture({
          'tsconfig.json': files['tsconfig.json']!,
        });
        await rm(path.join(root, 'tsconfig.json'));
        await symlink(
          path.join(other, 'tsconfig.json'),
          path.join(root, 'tsconfig.json'),
        );
      }
      const result = await collectModuleSources(root);
      expect(result.routes.find((r) => r.routeName === 'known')).toMatchObject({
        providers: [],
        complete: true,
      });
      expect(
        result.routes.some(
          (r) => r.routeName === 'invented' || r.routeName === 'maybe',
        ),
      ).toBe(false);
      expect(result.complete).toBe(false);
    },
  );

  it('does not replace an explicitly unknown object or loader with a factory default', async () => {
    const root = await fixture({
      'client/routes.ts': `const factory=({name='invented',list=()=>import('./mail.js'),detail=list}={})=>({name,componentLoader:detail});export default [{name:'known',componentLoader:()=>import('./quiet.js')},factory(unknownFactory()),factory({name:'unsafe',list:()=>import('./mail.js'),detail:unknownFactory()}),factory({name:'unsafe',name:'duplicate',list:()=>import('./mail.js')}),factory({name:'unsafe',list:()=>import('./mail.js'),[unknown]:'value'}),(async()=>({name:'unsafe',componentLoader:()=>import('./mail.js')}))()];`,
      'client/quiet.ts': `export default ()=>null;`,
      'client/mail.ts': `import {send} from '@nocobase/app-plugin-mail/client';export default ()=>send();`,
    });
    const result = await collectModuleSources(root);
    expect(result.routes).toEqual([
      {
        packageName: 'arbitrary-app',
        routeName: 'known',
        providers: [],
        complete: true,
      },
    ]);
    expect(result.complete).toBe(false);
  });

  it('invokes router factories in export order and snapshots each contribution before the next factory', async () => {
    const root = await fixture({
      'client/routes.ts':
        "export default [{name:'page',componentLoader:()=>import('./page.js')}];",
      'client/page.ts':
        "import {useApiClient} from '@nocobase/app-client';export default ()=>useApiClient().request({path:'items/export'});",
      'server/routes/index.ts':
        "import {Hono} from 'hono';import {defineApiRoutes} from '@nocobase/app-server/router';import {read} from '@nocobase/db';import {send} from '@nocobase/app-plugin-mail/server';const router=new Hono();const second=defineApiRoutes(()=>{router.get('/items/:id',c=>{read();return c.text('db');});return router;});const first=defineApiRoutes(()=>{router.get('/items/export',c=>{send();return c.text('mail');});return router;});export default [first,second];",
    });
    expect((await collectModuleSources(root)).routes[0]?.apiProviders).toEqual([
      '@nocobase/app-plugin-mail',
    ]);
    await writeFile(
      path.join(root, 'server/routes/index.ts'),
      "import {Hono} from 'hono';import {defineApiRoutes} from '@nocobase/app-server/router';import {read} from '@nocobase/db';import {send} from '@nocobase/app-plugin-mail/server';import {notify} from '@nocobase/app-plugin-notification/server';const router=new Hono().get('/items/:id',async(c,next)=>{read();await next();});const later=defineApiRoutes(()=>{router.get('/items/export',c=>{send();return c.text('mail');});return router;});export default [router,new Hono().get('/items/export',c=>{notify();return c.text('notification');}),later];",
    );
    expect((await collectModuleSources(root)).routes[0]?.apiProviders).toEqual([
      '@nocobase/app-plugin-notification',
      '@nocobase/db',
    ]);
  });
  it('respects side-effect registration modules without attributing unrelated router imports', async () => {
    const root = await fixture({
      'client/routes.ts':
        "export default [{name:'page',componentLoader:()=>import('./page.js')}];",
      'client/page.ts':
        "import {useApiClient} from '@nocobase/app-client';export default ()=>useApiClient().request({path:'items/export'});",
      'server/routes/index.ts':
        "import router from './router.js';import './register.js'; import {send} from '@nocobase/app-plugin-mail/server';router.get('/items/export',c=>{send();return c.text('mail');});export default router;",
      'server/routes/router.ts':
        "import {Hono} from 'hono';export default new Hono();",
      'server/routes/register.ts':
        "import router from './router.js';import {read} from '@nocobase/db';router.get('/items/:id',c=>{read();return c.text('db');});",
    });
    expect((await collectModuleSources(root)).routes[0]?.apiProviders).toEqual([
      '@nocobase/db',
    ]);
  });
  it('keeps imported router registration before importer additions and preserves ordered API exports', async () => {
    const root = await fixture({
      'client/routes.ts':
        "export default [{name:'page',componentLoader:()=>import('./page.js')}];",
      'client/page.ts':
        "import {useApiClient} from '@nocobase/app-client';export default ()=>useApiClient().request({path:'items/export'});",
      'server/routes/index.ts':
        "import router from './child.js'; import {send} from '@nocobase/app-plugin-mail/server'; router.get('/items/export',c=>{send();return c.text('mail');}); export default router;",
      'server/routes/child.ts':
        "import {Hono} from 'hono';import {read} from '@nocobase/db';const router=new Hono();router.get('/items/:id',c=>{read();return c.text('db');});export default router;",
    });
    expect((await collectModuleSources(root)).routes[0]?.apiProviders).toEqual([
      '@nocobase/db',
    ]);
    await writeFile(
      path.join(root, 'server/routes/index.ts'),
      "import child from './child.js';import {Hono} from 'hono';import {send} from '@nocobase/app-plugin-mail/server';export default [new Hono().get('/items/export',c=>{send();return c.text('mail');}),child];",
    );
    expect((await collectModuleSources(root)).routes[0]?.apiProviders).toEqual([
      '@nocobase/app-plugin-mail',
    ]);
  });

  it.each(['server/routes/index.js', 'server/routes.js'])(
    'matches source and published %s entries for applications and registered plugins',
    async (router) => {
      const host = await fixture({ 'client/routes.js': 'export default [];' });
      const results = [];
      for (const prefix of ['', 'dist/']) {
        const root = await fixture({
          [prefix + 'client/routes.js']:
            `export default [{name:'page',componentLoader:()=>import('./page.js')}];`,
          [prefix + 'client/page.js']:
            `import {useApiClient} from '@nocobase/app-client'; export default ()=>useApiClient().request({path:'items'});`,
          [prefix + router]:
            `import {Hono} from 'hono'; import {read} from '${router.includes('/index') ? '../read.js' : './read.js'}'; export default new Hono().get('/items',()=>read());`,
          [prefix + 'server/read.js']:
            `import {query} from '@nocobase/db'; import {send} from '@nocobase/app-plugin-notification/server'; export const unused=()=>send(); export const read=()=>query();`,
        });
        const application = await collectModuleSources(root);
        const plugin = await collectModuleSources(host, [
          {
            name: 'arbitrary-app',
            rootDir: root,
            evidence: 'serverRegistration',
          },
        ]);
        expect(application.routes[0]).toMatchObject({
          apiProviders: ['@nocobase/db'],
          complete: true,
        });
        expect(plugin).toEqual(application);
        results.push(application);
      }
      expect(results[1]).toEqual(results[0]);
    },
  );

  it.each(['providers/index.js', 'providers.js', 'service-provider.js'])(
    'follows compiled %s service registrations and selected methods',
    async (provider) => {
      const host = await fixture({ 'client/routes.js': 'export default [];' });
      const results = [];
      for (const prefix of ['', 'dist/']) {
        const up = provider.includes('/index') ? '../' : './';
        const root = await fixture({
          [prefix + 'client/routes.js']:
            `export default [{name:'page',componentLoader:()=>import('./page.js')}];`,
          [prefix + 'client/page.js']:
            `import {useApiClient} from '@nocobase/app-client'; export default ()=>useApiClient().request({path:'items'});`,
          [prefix + 'server/routes/index.js']:
            `import {Hono} from 'hono'; import {defineApiRoutes} from '@nocobase/app-server/router'; import {token} from '../tokens.js'; export default defineApiRoutes(app=>{const service=app.container.resolve(token); return new Hono().get('/items',()=>service.read());});`,
          [prefix + 'server/tokens.js']:
            `import {createServiceToken} from '@nocobase/service-provider'; export const token=createServiceToken('items');`,
          [prefix + 'server/' + provider]:
            `import {token} from '${up}tokens.js'; import {Items} from '${up}items.js'; export default class Provider{register(app){app.container.singleton(token,()=>new Items());}}`,
          [prefix + 'server/items.js']:
            `import {read} from '@nocobase/db'; import {send} from '@nocobase/app-plugin-notification/server'; export class Items{read(){return read();} unused(){return send();}}`,
        });
        const application = await collectModuleSources(root);
        expect(application.routes[0]).toMatchObject({
          apiProviders: ['@nocobase/db', '@nocobase/service-provider'],
          complete: true,
        });
        expect(
          await collectModuleSources(host, [
            {
              name: 'arbitrary-app',
              rootDir: root,
              evidence: 'serverRegistration',
            },
          ]),
        ).toEqual(application);
        results.push(application);
        await writeFile(
          path.join(root, prefix + 'server/' + provider),
          `import {token} from '${up}tokens.js'; import {Items} from '${up}items.js'; export default []; export class Unregistered{register(app){app.container.singleton(token,()=>new Items());}}`,
        );
        expect(
          (await collectModuleSources(root)).routes[0]?.apiProviders ?? [],
        ).not.toContain('@nocobase/db');
      }
      expect(results[1]).toEqual(results[0]);
    },
  );

  it.each(['missing', 'oversized', 'escaping'])(
    'marks %s backend dependencies incomplete while keeping frontend-only pages complete',
    async (failure) => {
      const root = await fixture({
        'dist/client/routes.js': `export default [{name:'page',componentLoader:()=>import('./page.js')}];`,
        'dist/client/page.js': `import {useApiClient} from '@nocobase/app-client'; export default ()=>useApiClient().request({path:'items'});`,
        'dist/server/routes.js': `import {Hono} from 'hono'; import {read} from './missing.js'; export default new Hono().get('/items',()=>read());`,
      });
      if (failure === 'oversized')
        await writeFile(
          path.join(root, 'dist/server/missing.js'),
          ' '.repeat(512_001),
        );
      if (failure === 'escaping') {
        const outside = await fixture({
          'secret.js': `import {read} from '@secret/provider'; export {read};`,
        });
        await symlink(
          path.join(outside, 'secret.js'),
          path.join(root, 'dist/server/missing.js'),
        );
      }
      const incomplete = await collectModuleSources(root);
      expect(incomplete).toMatchObject({
        complete: false,
        routes: [{ complete: false }],
      });
      expect(JSON.stringify(incomplete)).not.toContain('secret');
      await rm(path.join(root, 'dist/server'), { recursive: true });
      expect(await collectModuleSources(root)).toMatchObject({
        complete: false,
        routes: [{ complete: false }],
      });
      await writeFile(
        path.join(root, 'dist/client/page.js'),
        'export default ()=>null;',
      );
      expect(await collectModuleSources(root)).toMatchObject({
        complete: true,
        routes: [{ complete: true }],
      });
    },
  );

  it('keeps compiled request methods paired with paths and ignores fake clients and unrelated endpoints', async () => {
    const root = await fixture({
      'dist/client/routes.js': `export default [{name:'page',componentLoader:()=>import('./page.js')}];`,
      'dist/client/page.js': `import {useApiClient} from '@nocobase/app-client'; export default ()=>{const api=useApiClient(); api.request({method:'GET',path:'read'}); api.request({method:'POST',path:'other'}); const fake={request(){}}; fake.request({method:'POST',path:'read'});};`,
      'dist/server/routes.js': `import {Hono} from 'hono'; import {query} from '@nocobase/db'; import {transition} from '@nocobase/lifecycle'; export default new Hono().get('/read',()=>query()).post('/read',()=>transition());`,
    });
    expect((await collectModuleSources(root)).routes[0]?.apiProviders).toEqual([
      '@nocobase/db',
    ]);
  });

  it('recognizes the host API client resolved by useService and excludes other service tokens', async () => {
    const root = await fixture({
      'client/routes.ts': `export default [{name:'page',componentLoader:()=>import('./page.js')}];`,
      'client/page.ts': `import {useService,apiClientToken} from '@nocobase/app-client'; export default ()=>useService(apiClientToken).request({path:'items'});`,
      'server/routes/index.ts': `import {Hono} from 'hono'; import {read} from '@nocobase/db'; export default new Hono().get('/items',()=>read());`,
    });
    expect((await collectModuleSources(root)).routes[0]?.apiProviders).toEqual([
      '@nocobase/db',
    ]);
    await writeFile(
      path.join(root, 'client/page.ts'),
      `import {useService} from '@nocobase/app-client'; import {apiClientToken} from 'another-sdk'; export default ()=>useService(apiClientToken).request({path:'items'});`,
    );
    expect(
      (await collectModuleSources(root)).routes[0]?.apiProviders,
    ).toBeUndefined();
  });

  it('follows memoized request helpers and literal string normalization without running application code', async () => {
    const root = await fixture({
      'client/routes.ts': `export default [{name:'page',componentLoader:()=>import('./page.js')}];`,
      'client/page.ts': `import {useRead} from './api.js'; export default ()=>{useRead('items');useRead('other');};`,
      'client/api.ts': `import {useService,apiClientToken} from '@nocobase/app-client'; import {useCallback} from 'react'; function text(value){if(value==null)return ''; if(typeof value==='object')return JSON.stringify(value); return typeof value==='string'?value:String(value);} function useRequest(){const api=useService(apiClientToken);return useCallback((path,method='GET')=>api.request({path:text(path),method}),[api]);} export function useRead(path){const request=useRequest();return request(path);}`,
      'server/routes/index.ts': `import {Hono} from 'hono'; import {read} from '@nocobase/db'; import {send} from '@nocobase/app-plugin-notification/server'; export default new Hono().get('/items',()=>read()).post('/items',()=>send());`,
    });
    expect((await collectModuleSources(root)).routes[0]?.apiProviders).toEqual([
      '@nocobase/db',
    ]);
  });

  it('keeps each memoized request path paired with its own method', async () => {
    const root = await fixture({
      'client/routes.ts': `export default [{name:'page',componentLoader:()=>import('./page.js')}];`,
      'client/page.ts': `import {useApiClient} from '@nocobase/app-client'; import {useCallback} from 'react'; function useRequest(){const api=useApiClient();return useCallback((path,method='GET')=>api.request({path,method}),[api]);} export default ()=>{const request=useRequest();request('items');request('audit','POST');};`,
      'server/routes/index.ts': `import {Hono} from 'hono'; import {read} from '@nocobase/db'; import {send} from '@nocobase/app-plugin-notification/server'; export default new Hono().get('/items',()=>read()).post('/items',()=>send()).post('/audit',()=>read());`,
    });
    expect((await collectModuleSources(root)).routes[0]?.apiProviders).toEqual([
      '@nocobase/db',
    ]);
  });

  it('associates tuple-generated pages with routes registered through local helpers', async () => {
    const root = await fixture({
      'client/routes.ts': `export default [['books','icon'],['loans','icon']].map(([kind,icon])=>({name:\`page-\${String(kind)}\`,componentLoader:()=>import('./page.js')}));`,
      'client/page.ts': `import {useApiClient} from '@nocobase/app-client'; export default ()=>useApiClient().request({path:'books'});`,
      'server/routes/index.ts': `import {Hono} from 'hono'; import {defineApiRoutes} from '@nocobase/app-server/router'; import {register} from './register.js'; export default defineApiRoutes(()=>{const router=new Hono(); for(const name of ['books','loans'])register(router,name); return router;});`,
      'server/routes/register.ts': `import {read} from '@nocobase/db'; export function register(router,name){router.get(\`/\${name}\`,()=>read());}`,
    });
    expect(
      (await collectModuleSources(root)).routes.map(
        ({ routeName, apiProviders }) => ({ routeName, apiProviders }),
      ),
    ).toEqual([
      { routeName: 'page-books', apiProviders: ['@nocobase/db'] },
      { routeName: 'page-loans', apiProviders: ['@nocobase/db'] },
    ]);
  });

  it('keeps literal array-generated route names and conditional loaders paired', async () => {
    const root = await fixture({
      'client/routes.ts': `export default ['books','loans'].map(kind=>({name:kind==='books'?'catalog':'borrowing',componentLoader:()=>kind==='books'?import('./books.js'):import('./loans.js'),children:[{name:\`\${kind}-detail\`,componentLoader:()=>kind==='books'?import('./books.js'):import('./loans.js')}]}));`,
      'client/books.ts': `import {read} from '@nocobase/db'; export default ()=>read();`,
      'client/loans.ts': `import {send} from '@nocobase/app-plugin-notification/client'; export default ()=>send();`,
    });
    expect(
      (await collectModuleSources(root)).routes.map(
        ({ routeName, providers }) => ({ routeName, providers }),
      ),
    ).toEqual([
      { routeName: 'catalog', providers: ['@nocobase/db'] },
      { routeName: 'books-detail', providers: ['@nocobase/db'] },
      {
        routeName: 'borrowing',
        providers: ['@nocobase/app-plugin-notification'],
      },
      {
        routeName: 'loans-detail',
        providers: ['@nocobase/app-plugin-notification'],
      },
    ]);
  });

  it('follows aliased loaders, JSX props and non-null shared hook arguments to literal loop endpoints', async () => {
    const root = await fixture({
      'client/routes.ts': `const books=()=>import('./books.js'); const loans=()=>import('./loans.js'); export default [{name:'books',componentLoader:books},{name:'loans',componentLoader:loans}];`,
      'client/books.tsx': `import List from './list.js'; export default ()=> <List mode='books'/>;`,
      'client/loans.tsx': `import List from './list.js'; export default ()=> <List mode='loans'/>;`,
      'client/list.tsx': `import {useLoad} from './hooks.js'; export default function List({mode='books'}){const isBook=mode==='books'||mode==='catalog'; const resource=isBook?'books':'loans'; return useLoad(\`library/\${resource}?page=1\`);}`,
      'client/hooks.ts': `import {useApiClient} from '@nocobase/app-client'; export function useLoad(path:string|undefined){const api=useApiClient(); return api.request({path:path!});}`,
      'server/routes/index.ts': `import {Hono} from 'hono'; import {read} from '@nocobase/db'; import {send} from '@nocobase/app-plugin-notification/server'; const router=new Hono(); for(const name of ['books','catalog'] as const){router.get(\`/library/\${name}\`,()=>read());} for(const own of [true,false]){const base=own?'/library/myLoans':'/library/loans'; router.get(base,()=>send());} export default router;`,
    });
    expect(
      (await collectModuleSources(root)).routes.map((route) => ({
        name: route.routeName,
        providers: route.apiProviders,
      })),
    ).toEqual([
      { name: 'books', providers: ['@nocobase/db'] },
      { name: 'loans', providers: ['@nocobase/app-plugin-notification'] },
    ]);
    await writeFile(
      path.join(root, 'server/routes/index.ts'),
      `import {Hono} from 'hono'; import {read} from '@nocobase/db'; const router=new Hono(); for(const name of unknownNames){router.get(\`/library/\${name}\`,()=>read());} export default router;`,
    );
    expect(
      (await collectModuleSources(root)).routes.every(
        (route) => !route.apiProviders?.length,
      ),
    ).toBe(true);
  });

  it('resolves object argument defaults without guessing values supplied through a spread', async () => {
    const root = await fixture({
      'client/routes.ts': `export default [{name:'page',componentLoader:()=>import('./page.js')}];`,
      'client/page.ts': `import {useApiClient} from '@nocobase/app-client'; function load({path='items',method='GET'}){return useApiClient().request({path,method});} export default ()=>load({});`,
      'server/routes/index.ts': `import {Hono} from 'hono'; import {read} from '@nocobase/db'; const router=new Hono(); router.get('/items',()=>read()); export default router;`,
    });
    expect((await collectModuleSources(root)).routes[0]?.apiProviders).toEqual([
      '@nocobase/db',
    ]);
    await writeFile(
      path.join(root, 'client/page.ts'),
      `import {useApiClient} from '@nocobase/app-client'; function load({path='items',method='GET'}){return useApiClient().request({path,method});} export default ()=>load({...unknown});`,
    );
    expect(
      (await collectModuleSources(root)).routes[0]?.apiProviders,
    ).toBeUndefined();
    await writeFile(
      path.join(root, 'client/page.ts'),
      `import {useApiClient} from '@nocobase/app-client'; function load({path='items',method='GET'}){return useApiClient().request({path,method});} export default ()=>load({path:unknown});`,
    );
    expect(
      (await collectModuleSources(root)).routes[0]?.apiProviders,
    ).toBeUndefined();
  });

  it('recognizes a database injected into a service constructor even when the service imports only database types', async () => {
    const root = await fixture({
      'client/routes.ts': `export default [{name:'orders',componentLoader:()=>import('./page.js')}];`,
      'client/page.ts': `import {useApiClient} from '@nocobase/app-client'; export default ()=>{const api=useApiClient(); return api.request({path:'orders'});};`,
      'server/routes/index.ts': `import {Hono} from 'hono'; import {defineApiRoutes} from '@nocobase/app-server/router'; import {ordersToken} from '../tokens.js'; export default defineApiRoutes(app=>{const router=new Hono(); const orders=app.container.resolve(ordersToken); router.get('/orders',()=>orders.list()); return router;});`,
      'server/tokens.ts': `import {createServiceToken} from '@nocobase/service-provider'; export const ordersToken=createServiceToken('orders');`,
      'server/providers/index.ts': `import {databaseManagerToken} from '@nocobase/db'; import {ordersToken} from '../tokens.js'; import {Orders} from '../orders.js'; export default class Provider{register(app){app.container.singleton(ordersToken,container=>new Orders(container.resolve(databaseManagerToken)));}}`,
      'server/orders.ts': `import type {DatabaseManager} from '@nocobase/db'; export class Orders{constructor(private database:DatabaseManager){} list(){return this.database.repository('orders').findMany();}}`,
    });
    expect(
      (await collectModuleSources(root)).routes[0]?.apiProviders,
    ).toContain('@nocobase/db');
    await writeFile(
      path.join(root, 'server/providers/index.ts'),
      `import {databaseManagerToken} from '@nocobase/db'; import {ordersToken} from '../tokens.js'; import {Orders} from '../orders.js'; export default []; export class UnregisteredProvider{register(app){app.container.singleton(ordersToken,container=>new Orders(container.resolve(databaseManagerToken)));}}`,
    );
    expect(
      (await collectModuleSources(root)).routes[0]?.apiProviders ?? [],
    ).not.toContain('@nocobase/db');
  });
  it('composes nested router prefixes and follows request arguments through a shared helper', async () => {
    const root = await fixture({
      'client/routes.ts': `export default [{name:'orders',componentLoader:()=>import('./page.js')}];`,
      'client/page.ts': `import {useApiClient as useApi} from '@nocobase/app-client'; import {read} from './api.js'; export default ()=>{const api=useApi(); return read(api,'sales/orders','get');};`,
      'client/api.ts': `export function read(api,path,method){return api.request({path,method});}`,
      'server/routes/index.ts': `import {Hono} from 'hono'; import {defineApiRoutes} from '@nocobase/app-server/router'; import orders from './orders.js'; export default defineApiRoutes(()=>new Hono().route('/sales',orders));`,
      'server/routes/orders.ts': `import {Hono} from 'hono'; import {read} from '@nocobase/db'; const router=new Hono().basePath('/orders'); router.get('/',()=>read()); export default router;`,
    });
    expect((await collectModuleSources(root)).routes[0]?.apiProviders).toEqual([
      '@nocobase/db',
    ]);
  });

  it('matches proven API repository clients to explicitly exposed actions and collection names', async () => {
    const root = await fixture({
      'client/routes.ts': `export default [{name:'orders',componentLoader:()=>import('./page.js')}];`,
      'client/page.ts': `import {useApiClient} from '@nocobase/app-client'; export default ()=>{const api=useApiClient(); const orders=api.repository('salesOrders'); return orders.findMany();};`,
      'server/routes/index.ts': `import {defineRepositoryApiRoutes} from '@nocobase/app-server/router'; const exposures=[{name:'salesOrders',collection:'orders',policy:{},actions:{findMany:{}}}]; export default [defineRepositoryApiRoutes({repositories:exposures})];`,
    });
    expect((await collectModuleSources(root)).routes[0]).toMatchObject({
      apiProviders: ['@nocobase/db'],
      collections: ['orders'],
    });
    await writeFile(
      path.join(root, 'client/page.ts'),
      `import {useApiClient} from '@nocobase/app-client'; export default ()=>{const api=useApiClient(); return api.repository('salesOrders').deleteOne();};`,
    );
    expect(
      (await collectModuleSources(root)).routes[0]?.apiProviders,
    ).toBeUndefined();
  });

  it('follows an explicitly registered service token to the selected method without borrowing unused methods', async () => {
    const root = await fixture({
      'client/routes.ts': `export default [{name:'orders',componentLoader:()=>import('./page.js')}];`,
      'client/page.ts': `import {useApiClient} from '@nocobase/app-client'; export default ()=>{const api=useApiClient(); return api.request({path:'orders'});};`,
      'server/routes/index.ts': `import {Hono} from 'hono'; import {defineApiRoutes} from '@nocobase/app-server/router'; import {ordersToken} from '../tokens.js'; export default defineApiRoutes(app=>{const router=new Hono(); const orders=app.container.resolve(ordersToken); router.get('/orders',()=>orders.list()); return router;});`,
      'server/tokens.ts': `import {createServiceToken} from '@nocobase/service-provider'; export const ordersToken=createServiceToken('orders');`,
      'server/providers/index.ts': `import {ordersToken} from '../tokens.js'; import {Orders} from '../orders.js'; export default class Provider{register(app){app.container.singleton(ordersToken,()=>new Orders());}}`,
      'server/orders.ts': `import {read} from '@nocobase/db'; import {send} from '@nocobase/app-plugin-notification/server'; export class Orders{list(){return read();} unused(){return send();}}`,
    });
    expect((await collectModuleSources(root)).routes[0]?.apiProviders).toEqual([
      '@nocobase/db',
      '@nocobase/service-provider',
    ]);
  });

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
