import {
  chmod,
  symlink,
  mkdir,
  mkdtemp,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { ServiceContainer } from '@nocobase/service-provider';
import { DefaultFoundationService } from '../../server/services/foundation.js';
import { ModuleSourceCache } from '../../server/module-source-cache.js';

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});
async function fixture(name = 'fixture-app', extension = 'js') {
  const root = await mkdtemp(path.join(os.tmpdir(), 'foundation-cache-'));
  roots.push(root);
  await mkdir(path.join(root, 'client'));
  await writeFile(path.join(root, 'package.json'), JSON.stringify({ name }));
  await writeFile(
    path.join(root, `client/routes.${extension}`),
    `export default [{name:'page',componentLoader:()=>import('./page.js')}];`,
  );
  await writeFile(
    path.join(root, `client/page.${extension}`),
    `export default ()=>null;`,
  );
  return root;
}

it('reuses compiled associations, expires them and keeps source checkouts uncached', async () => {
  let now = 0;
  const cache = new ModuleSourceCache(() => now);
  const root = await fixture();
  const first = await cache.read(root);
  expect(first.routes).toHaveLength(1);
  expect(await cache.read(root)).toBe(first);
  now = 60_000;
  const expired = await cache.read(root);
  expect(expired).toEqual(first);
  expect(expired).not.toBe(first);
  const source = await fixture('source-app', 'ts');
  const before = await cache.read(source);
  expect(await cache.read(source)).not.toBe(before);
});

it('invalidates changed page evidence, package identity and newly readable missing dependencies', async () => {
  const root = await fixture();
  const cache = new ModuleSourceCache();
  const first = await cache.read(root);
  await writeFile(
    path.join(root, 'client/page.js'),
    `import {read} from '@nocobase/db'; export default ()=>read();`,
  );
  const changed = await cache.read(root);
  expect(changed).not.toBe(first);
  expect(changed.routes[0]?.providers).toContain('@nocobase/db');
  await writeFile(
    path.join(root, 'client/page.js'),
    `import {read} from './missing.js'; export default ()=>read();`,
  );
  const missing = await cache.read(root);
  expect(missing.routes[0]?.complete).toBe(false);
  await writeFile(
    path.join(root, 'client/missing.js'),
    `export {read} from '@nocobase/db';`,
  );
  expect((await cache.read(root)).routes[0]?.providers).toContain(
    '@nocobase/db',
  );
  await writeFile(
    path.join(root, 'package.json'),
    JSON.stringify({ name: 'renamed-app' }),
  );
  expect((await cache.read(root)).routes[0]?.packageName).toBe('renamed-app');
});

it('isolates applications, instances, registered plugins, versions and roots', async () => {
  const root = await fixture();
  const other = await fixture('other-app');
  const plugin = await fixture('plugin');
  const replacement = await fixture('plugin');
  const cache = new ModuleSourceCache();
  const first = await cache.read(root);
  expect((await cache.read(other)).routes[0]?.packageName).toBe('other-app');
  expect(await new ModuleSourceCache().read(root)).not.toBe(first);
  const runtime = [
    {
      name: 'plugin',
      rootDir: plugin,
      version: '1',
      evidence: 'serverRegistration' as const,
    },
  ];
  const registered = await cache.read(root, runtime);
  expect(registered.routes).toHaveLength(2);
  expect(await cache.read(root, runtime)).toBe(registered);
  expect(await cache.read(root, [{ ...runtime[0]!, version: '2' }])).not.toBe(
    registered,
  );
  const moved = await cache.read(root, [
    { ...runtime[0]!, rootDir: replacement },
  ]);
  expect(moved).not.toBe(registered);
  expect((await cache.read(root)).routes).toHaveLength(1);
});

it('does not retain unreadable application evidence and recovers on the next read', async () => {
  const root = await fixture();
  const cache = new ModuleSourceCache();
  const first = await cache.read(root);
  await writeFile(path.join(root, 'package.json'), '{');
  const failed = await cache.read(root);
  expect(failed).toEqual({ routes: [], complete: false });
  expect(await cache.read(root)).not.toBe(failed);
  await writeFile(
    path.join(root, 'package.json'),
    JSON.stringify({ name: 'restored' }),
  );
  const recovered = await cache.read(root);
  expect(recovered.routes[0]?.packageName).toBe('restored');
  expect(recovered).not.toBe(first);
});

it('invalidates a source-free build manifest and recovers from missing or invalid build output', async () => {
  const root = await fixture();
  await rm(path.join(root, 'client'), { recursive: true });
  await mkdir(path.join(root, 'server'));
  const file = path.join(root, 'server/foundation-modules.json');
  const document = (provider: string) =>
    JSON.stringify({
      schemaVersion: 1,
      packageName: 'fixture-app',
      sources: {
        complete: true,
        routes: [
          {
            packageName: 'fixture-app',
            routeName: 'articles',
            providers: [provider],
            complete: true,
          },
        ],
      },
    });
  const cache = new ModuleSourceCache();
  expect((await cache.read(root)).routes).toHaveLength(0);
  await writeFile(file, document('@nocobase/db'));
  const first = await cache.read(root);
  expect(await cache.read(root)).toBe(first);
  await writeFile(file, document('@nocobase/app-plugin-file'));
  expect((await cache.read(root)).routes[0]?.providers).toEqual([
    '@nocobase/app-plugin-file',
  ]);
  await writeFile(file, '{}');
  expect((await cache.read(root)).routes).toHaveLength(0);
  await writeFile(file, document('@nocobase/db'));
  expect((await cache.read(root)).routes[0]?.providers).toEqual([
    '@nocobase/db',
  ]);
});

it('recovers from an unreadable compiled page without retaining failed evidence', async () => {
  const root = await fixture();
  const file = path.join(root, 'client/page.js');
  const cache = new ModuleSourceCache();
  await cache.read(root);
  await chmod(file, 0);
  const failed = await cache.read(root);
  expect(failed.routes[0]?.complete).toBe(false);
  expect(await cache.read(root)).not.toBe(failed);
  await chmod(file, 0o644);
  expect((await cache.read(root)).routes[0]?.complete).toBe(true);
});

it('invalidates a replaced registration symlink', async () => {
  const root = await fixture();
  const plugin = await fixture('plugin');
  const replacement = await fixture('plugin');
  await writeFile(
    path.join(replacement, 'client/page.js'),
    `import {read} from '@nocobase/db';export default ()=>read();`,
  );
  const link = path.join(root, 'plugin');
  await symlink(plugin, link);
  const runtime = [
    { name: 'plugin', rootDir: link, evidence: 'serverRegistration' as const },
  ];
  const cache = new ModuleSourceCache();
  await cache.read(root, runtime);
  await rm(link);
  await symlink(replacement, link);
  expect(
    (await cache.read(root, runtime)).routes.find(
      (route) => route.packageName === 'plugin',
    )?.providers,
  ).toContain('@nocobase/db');
});

it('recollects dynamic observations and their real time while reusing unchanged static associations', async () => {
  const root = await fixture();
  let now = 0;
  let calls = 0;
  const service = new DefaultFoundationService({
    rootDir: root,
    container: new ServiceContainer(),
    config: { get: () => undefined },
    hasClient: true,
    now: () => now,
    collectors: [
      {
        key: 'interface',
        packages: [],
        collect: async () => ({
          key: 'interface',
          status: 'active',
          completeness: 'complete',
          issues: [],
          facts: [],
          parts: [],
          packages: [],
          metrics: [{ key: 'observations', value: ++calls, unit: 'count' }],
        }),
      },
    ],
  });
  const first = await service.overview();
  now = 1000;
  const refreshed = await service.overview({ refresh: true });
  expect(refreshed.moduleSources).toBe(first.moduleSources);
  expect(refreshed.checkedAt).not.toBe(first.checkedAt);
  expect(calls).toBe(2);
  now = 32_000;
  const expired = await service.overview();
  expect(expired.moduleSources).toBe(first.moduleSources);
  expect(calls).toBe(3);
});

it('invalidates changes behind a linked build manifest', async () => {
  const root = await fixture();
  await rm(path.join(root, 'client'), { recursive: true });
  await mkdir(path.join(root, 'server'));
  const target = path.join(root, 'build-evidence.json');
  const document = (provider: string) =>
    JSON.stringify({
      schemaVersion: 1,
      packageName: 'fixture-app',
      sources: {
        complete: true,
        routes: [
          {
            packageName: 'fixture-app',
            routeName: 'articles',
            providers: [provider],
            complete: true,
          },
        ],
      },
    });
  await writeFile(target, document('@nocobase/db'));
  await symlink(target, path.join(root, 'server/foundation-modules.json'));
  const cache = new ModuleSourceCache();
  const first = await cache.read(root);
  expect(await cache.read(root)).toBe(first);
  await writeFile(target, document('@nocobase/app-plugin-file'));
  expect((await cache.read(root)).routes[0]?.providers).toEqual([
    '@nocobase/app-plugin-file',
  ]);
});

it('keeps the parser size boundary unknown and invalidates it when the file becomes analyzable', async () => {
  const root = await fixture();
  const file = path.join(root, 'client/page.js');
  await writeFile(file, ' '.repeat(512_001));
  const cache = new ModuleSourceCache();
  const unknown = await cache.read(root);
  expect(unknown.routes[0]?.complete).toBe(false);
  expect(await cache.read(root)).toBe(unknown);
  await writeFile(
    file,
    `import {read} from '@nocobase/db';export default ()=>read();`,
  );
  expect((await cache.read(root)).routes[0]?.providers).toContain(
    '@nocobase/db',
  );
});

it('does not retain an oversized registration identity', async () => {
  const root = await fixture();
  const runtime = [
    {
      name: 'plugin',
      version: 'x'.repeat(1_000_000),
      evidence: 'apiContribution' as const,
    },
  ];
  const cache = new ModuleSourceCache();
  const first = await cache.read(root, runtime);
  expect(await cache.read(root, runtime)).not.toBe(first);
});

it('invalidates missing, inherited and unreadable local alias declarations', async () => {
  const root = await fixture();
  await writeFile(
    path.join(root, 'client/page.js'),
    `import {read} from '@/evidence';export default ()=>read();`,
  );
  await writeFile(
    path.join(root, 'client/database.js'),
    `export {read} from '@nocobase/db';`,
  );
  await writeFile(
    path.join(root, 'client/files.js'),
    `export {read} from '@nocobase/app-plugin-file';`,
  );
  const cache = new ModuleSourceCache();
  const missing = await cache.read(root);
  expect(missing.routes[0]?.providers).not.toContain('@nocobase/db');
  expect(await cache.read(root)).toBe(missing);
  const config = path.join(root, 'tsconfig.json');
  const inherited = path.join(root, 'aliases.json');
  const declarations = (target: string) =>
    JSON.stringify({ compilerOptions: { paths: { '@/evidence': [target] } } });
  await writeFile(config, JSON.stringify({ extends: './aliases.json' }));
  await writeFile(inherited, declarations('./client/database.js'));
  const database = await cache.read(root);
  expect(database.routes[0]?.providers).toContain('@nocobase/db');
  expect(await cache.read(root)).toBe(database);
  await writeFile(inherited, declarations('./client/files.js'));
  const files = await cache.read(root);
  expect(files.routes[0]?.providers).toContain('@nocobase/app-plugin-file');
  expect(files.routes[0]?.providers).not.toContain('@nocobase/db');
  await chmod(inherited, 0);
  const failed = await cache.read(root);
  expect(failed.routes[0]?.providers).not.toContain(
    '@nocobase/app-plugin-file',
  );
  expect(await cache.read(root)).not.toBe(failed);
  await chmod(inherited, 0o644);
  expect((await cache.read(root)).routes[0]?.providers).toContain(
    '@nocobase/app-plugin-file',
  );
});
