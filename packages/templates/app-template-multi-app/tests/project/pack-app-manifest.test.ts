import { execFileSync } from 'node:child_process';
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const helper = pathToFileURL(
  path.resolve(import.meta.dirname, '../../scripts/pack-app-manifest.mjs'),
).href;
const temporary: string[] = [];
afterEach(async () => {
  await Promise.all(
    temporary
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

async function fixture() {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'native-app-pack-'));
  temporary.push(directory);
  const app = path.join(directory, 'payload');
  await mkdir(app);
  await writeFile(
    path.join(directory, 'package.json'),
    JSON.stringify({ private: true }),
  );
  await writeFile(
    path.join(directory, 'pnpm-workspace.yaml'),
    'packages: [core]\ncatalog:\n  registry-runtime: ^4.2.0\ncatalogs:\n  testing:\n    registry-testing: ~5.3.0\n',
  );
  const core = path.join(directory, 'core');
  await mkdir(core);
  const manifest = {
    name: 'fixture-app',
    version: '1.0.0',
    packageManager: 'pnpm@11.7.0',
    files: [],
    dependencies: {
      '@fixture/core': 'workspace:^',
      'registry-runtime': 'catalog:',
      'registry-explicit': '^9.8.7',
    },
    devDependencies: { 'registry-testing': 'catalog:testing' },
    scripts: {
      prepack:
        'node -e "throw new Error(\'Do not run App lifecycle scripts\')"',
      postinstall: 'nocobase skills sync',
    },
  };
  return { directory, app, core, manifest };
}

function pack(app: string, packages: [string, string][], archive: string) {
  execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `import { packAppManifest } from ${JSON.stringify(helper)};
       await packAppManifest(process.argv[1], new Map(JSON.parse(process.argv[2])), process.argv[3]);`,
      app,
      JSON.stringify(packages),
      archive,
    ],
    { stdio: 'pipe', timeout: 20000 },
  );
}

describe('native pnpm manifest packaging', () => {
  it('follows workspace versions and default/named catalogs without installing registry dependencies or running App hooks', async () => {
    const { directory, app, core, manifest } = await fixture();
    const filename = path.join(app, 'package.json');
    for (const version of ['1.2.3', '2.0.0-beta.1']) {
      await writeFile(
        path.join(core, 'package.json'),
        JSON.stringify({ name: '@fixture/core', version }),
      );
      await writeFile(filename, JSON.stringify(manifest));
      pack(app, [['@fixture/core', core]], path.join(directory, 'app.tgz'));
      expect(JSON.parse(await readFile(filename, 'utf8'))).toMatchObject({
        dependencies: {
          '@fixture/core': '^' + version,
          'registry-runtime': '^4.2.0',
          'registry-explicit': '^9.8.7',
        },
        devDependencies: { 'registry-testing': '~5.3.0' },
        packageManager: manifest.packageManager,
        scripts: manifest.scripts,
      });
      await expect(access(path.join(app, 'node_modules'))).rejects.toThrow();
      await expect(
        access(path.join(directory, 'pnpm-lock.yaml')),
      ).rejects.toThrow();
    }
  });

  it.each(['workspace', 'catalog'])(
    'fails closed on an unresolved %s reference and removes staging links',
    async (protocol) => {
      const { directory, app, core, manifest } = await fixture();
      await writeFile(
        path.join(core, 'package.json'),
        JSON.stringify({ name: '@fixture/core', version: '1.2.3' }),
      );
      if (protocol === 'catalog')
        manifest.dependencies['registry-runtime'] = 'catalog:missing';
      const original = JSON.stringify(manifest);
      const filename = path.join(app, 'package.json');
      await writeFile(filename, original);
      const archive = path.join(directory, 'failed.tgz');
      expect(() =>
        pack(
          app,
          protocol === 'workspace' ? [] : [['@fixture/core', core]],
          archive,
        ),
      ).toThrow();
      expect(await readFile(filename, 'utf8')).toBe(original);
      await expect(access(path.join(app, 'node_modules'))).rejects.toThrow();
      await expect(access(archive)).rejects.toThrow();
    },
  );
});
