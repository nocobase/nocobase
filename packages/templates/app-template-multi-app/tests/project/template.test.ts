import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import ts from 'typescript';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import manifest from '../../package.json' with { type: 'json' };
import defaultManifest from '../../../app-template-default/package.json' with { type: 'json' };

type AppManifest = {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
};

const root = path.resolve(import.meta.dirname, '../..');
const source = path.join(root, 'template');
const temporary: string[] = [];
afterEach(async () => {
  await Promise.all(
    temporary
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

function audit(directory: string, allowRuntimeData = false): string {
  return execFileSync(
    process.execPath,
    [
      'scripts/check-template.mjs',
      directory,
      ...(allowRuntimeData ? ['--allow-runtime-data'] : []),
    ],
    { cwd: root, encoding: 'utf8', stdio: 'pipe' },
  );
}

describe('root Main application template', () => {
  it('ships syntactically complete TypeScript and TSX for Main and its child App', async () => {
    const sources: string[] = [];
    async function collect(directory: string): Promise<void> {
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        if (
          ['node_modules', 'dist', 'storage', 'coverage'].includes(entry.name)
        )
          continue;
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) await collect(file);
        else if (/\.[cm]?tsx?$/u.test(file)) sources.push(file);
      }
    }
    await collect(source);
    expect(sources.length).toBeGreaterThan(500);
    const program = ts.createProgram(sources, {
      noEmit: true,
      noResolve: true,
      noLib: true,
      jsx: ts.JsxEmit.Preserve,
    });
    expect(
      program.getSyntacticDiagnostics().map((diagnostic) => ({
        file: diagnostic.file?.fileName,
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
      })),
    ).toEqual([]);
  });

  it('checks the root Main and child without installing commercial packages', () => {
    expect(audit(source)).toContain('Template structure checked: ., apps/sub');
  });

  it('exposes demo help without building, loading an App or initializing data', () => {
    const output = execFileSync(
      process.execPath,
      ['scripts/demo.mjs', '--help'],
      { cwd: source, encoding: 'utf8' },
    );
    expect(output).toContain('--initialize --plan');
  });

  it('retains explicit initialization and historical task identities', async () => {
    const demo = await readFile(path.join(source, 'scripts/demo.mjs'), 'utf8');
    expect(demo).toContain(
      'const plan = initialize ? await readDemoPlan(args[2]) : undefined',
    );
    expect(demo).toContain('if (plan)');
    expect(demo).not.toContain('build-templates');
    const provision = await readFile(
      path.join(source, 'scripts/prepare-demo.mjs'),
      'utf8',
    );
    expect(provision).toContain('if (!existing)');
    expect(provision).toContain(
      'Existing instances and their selected versions/settings are deliberately retained',
    );
    for (const app of ['.', 'apps/sub']) {
      expect(
        await readFile(path.join(source, app, 'server/standalone.ts'), 'utf8'),
      ).not.toContain('prepare-demo');
    }
    expect(Object.keys(manifest.devDependencies)).not.toEqual(
      expect.arrayContaining([
        '@nocobase/app-plugin-multi-app',
        '@nocobase/app-plugin-identity-provider',
        '@nocobase/app-plugin-platform-sso',
      ]),
    );
  });

  it(
    'packs a complete root Main, child App and immutable migration history without the tooling wrapper',
    { timeout: 60000 },
    async () => {
      const directory = await mkdtemp(
        path.join(os.tmpdir(), 'multi-app-pack-test-'),
      );
      temporary.push(directory);
      const sourceManifests = await Promise.all(
        ['', 'apps/sub/'].map((app) =>
          readFile(path.join(source, app, 'package.json'), 'utf8'),
        ),
      );
      const workspaceConfiguration = path.resolve(
        root,
        '../../..',
        'pnpm-workspace.yaml',
      );
      const catalogBefore = await readFile(workspaceConfiguration, 'utf8');
      const projects = JSON.parse(
        execFileSync('pnpm', ['-r', 'list', '--depth=-1', '--json'], {
          cwd: root,
          encoding: 'utf8',
        }),
      ) as { name: string; version: string }[];
      const versions = new Map(
        projects.map((project) => [project.name, project.version]),
      );
      const defaultArchive = path.join(directory, 'default.tgz');
      execFileSync('pnpm', ['pack', '--out', defaultArchive], {
        cwd: path.resolve(root, '../app-template-default'),
        stdio: 'pipe',
      });
      const defaultPacked = JSON.parse(
        execFileSync('tar', ['-xOzf', defaultArchive, 'package/package.json'], {
          encoding: 'utf8',
        }),
      ) as AppManifest;
      const defaultRanges: Record<string, string> = {
        ...defaultManifest.dependencies,
        ...defaultManifest.devDependencies,
      };
      const defaultPackedRanges = {
        ...defaultPacked.dependencies,
        ...defaultPacked.devDependencies,
      };
      const archive = path.join(directory, 'template.tgz');
      try {
        execFileSync('pnpm', ['pack', '--out', archive], {
          cwd: root,
          stdio: 'pipe',
        });
      } catch (error) {
        const failure = error as { stdout?: Buffer; stderr?: Buffer };
        throw new Error(
          `Template pack failed: ${failure.stdout?.toString()}\n${failure.stderr?.toString()}`,
          { cause: error },
        );
      }
      const listed = execFileSync('tar', ['-tzf', archive], {
        encoding: 'utf8',
      })
        .trim()
        .split('\n');
      const unpack = (file: string): string =>
        execFileSync('tar', ['-xOzf', archive, `package/${file}`], {
          encoding: 'utf8',
        });
      const guidance = JSON.parse(
        await readFile(
          createRequire(path.join(root, 'package.json')).resolve(
            '@nocobase/app-skills/package.json',
          ),
          'utf8',
        ),
      ) as { version: string };
      for (const app of ['', 'apps/sub/']) {
        for (const file of [
          'package.json',
          '.agents/rules/workspace.md',
          '.agents/rules/multi-app-skills.md',
          '.prettierignore',
          'README.MD',
          'gitignore',
          'Dockerfile',
          'server/standalone.ts',
          'client/runtime.ts',
          'database/main/migrations/202610060001_create_device_code.ts',
          'public/assets/logo.png',
        ]) {
          expect(listed).toContain(`package/${app}${file}`);
        }
        const packedApp = JSON.parse(
          unpack(`${app}package.json`),
        ) as AppManifest;
        expect(unpack(`${app}package.json`)).not.toMatch(
          /"(?:workspace:|catalog:|file:|link:)/u,
        );
        expect(packedApp.devDependencies['@nocobase/app-skills']).toBe(
          guidance.version,
        );
        const maintained = JSON.parse(
          await readFile(path.join(source, app, 'package.json'), 'utf8'),
        ) as AppManifest;
        for (const group of ['dependencies', 'devDependencies'] as const) {
          for (const [name, range] of Object.entries(maintained[group])) {
            if (defaultRanges[name]) {
              expect(range).toBe(defaultRanges[name]);
              expect(packedApp[group][name]).toBe(defaultPackedRanges[name]);
            }
            if (range.startsWith('workspace:')) {
              const version = versions.get(name);
              expect(version).toBeDefined();
              expect(packedApp[group][name]).toBe(
                range === 'workspace:*'
                  ? version
                  : range.slice('workspace:'.length) + version,
              );
            }
            if (!/^(?:workspace:|catalog:)/u.test(range)) {
              expect(packedApp[group][name]).toBe(range);
            }
          }
        }
        expect(packedApp.scripts.postinstall).toBe('nocobase skills sync');
        expect(packedApp.scripts.dev).toBe('nocobase dev');
        expect(packedApp.scripts.build).toBe('nocobase build');
      }
      expect(await readFile(workspaceConfiguration, 'utf8')).toBe(
        catalogBefore,
      );
      expect(
        await Promise.all(
          ['', 'apps/sub/'].map((app) =>
            readFile(path.join(source, app, 'package.json'), 'utf8'),
          ),
        ),
      ).toEqual(sourceManifests);
      const packed = JSON.parse(unpack('package.json')) as typeof manifest & {
        nocobase: {
          templateKind: string;
          appDirectories: string[];
          templatePackage: string;
          defaultTemplateVersion: string;
        };
      };
      expect(packed).toMatchObject({
        name: manifest.name,
        version: manifest.version,
        nocobase: {
          templateKind: 'app',
          appDirectories: ['.', 'apps/sub'],
          templatePackage: manifest.name,
          defaultTemplateVersion: manifest.version,
        },
      });
      expect(packed.publishConfig).not.toHaveProperty('directory');
      expect(unpack('client/runtime.ts')).toContain(
        `packageName: '${manifest.name}'`,
      );
      expect(listed).not.toContain('package/scripts/build-template.mjs');
      expect(listed).not.toContain('package/scripts/pack-app-manifest.mjs');
      expect(
        listed.some((name) =>
          /package\/(?:apps\/main|template|skills)\//u.test(name),
        ),
      ).toBe(false);
      expect(
        listed.some((name) =>
          /\/(?:node_modules|dist|storage|vendor|app-templates|\.agents\/skills)\//u.test(
            name,
          ),
        ),
      ).toBe(false);
      expect(
        listed.some((name) =>
          /\/(?:config\.yml|\.env(?:\.|$)|database\.sqlite)/u.test(name),
        ),
      ).toBe(false);
      for (const file of [
        'apps/sub/shared/template.ts',
        'scripts/demo.mjs',
        'scripts/prepare-demo.mjs',
        'scripts/check-host-stop.mjs',
        'apps/sub/.cursor/mcp.json',
        'apps/sub/.vscode/mcp.json',
        'apps/sub/.mcp.json',
      ]) {
        expect(listed).toContain(`package/${file}`);
      }
      const migrationBlobs = {
        'database/main/migrations/202610060001_create_device_code.ts':
          '63b27a38842da0566fba9424ef869f97797b77e4',
        'database/main/migrations/202611020002_create_mutation_receipts.ts':
          'fefa5b0a79c166de4d3bd4a296056e9ba0f0b044',
        'apps/sub/database/main/migrations/202610060001_create_device_code.ts':
          '63b27a38842da0566fba9424ef869f97797b77e4',
        'apps/sub/database/main/migrations/202611020002_create_mutation_receipts.ts':
          'fefa5b0a79c166de4d3bd4a296056e9ba0f0b044',
        'apps/sub/database/main/migrations/202611040200_lab.ts':
          'f8dc9f7754dfe8975a3aa51776d5aeec0a4c0cbe',
        'apps/sub/database/main/seeds/202611040201_lab_settings.ts':
          'a55f59a69f7166eda02e087c08755833324ca87c',
      };
      for (const [file, expectedBlob] of Object.entries(migrationBlobs)) {
        const bytes = execFileSync('tar', [
          '-xOzf',
          archive,
          `package/${file}`,
        ]);
        expect({
          file,
          blob: createHash('sha1')
            .update(`blob ${bytes.length}\0`)
            .update(bytes)
            .digest('hex'),
        }).toEqual({ file, blob: expectedBlob });
      }
      execFileSync('tar', ['-xzf', archive, '-C', directory]);
      const generated = path.join(directory, 'package');
      expect(audit(generated)).toContain('runtime acceptance are separate');
      for (const app of ['', 'apps/sub/']) {
        const filename = path.join(generated, app, 'package.json');
        const original = await readFile(filename, 'utf8');
        for (const range of [
          'workspace:^',
          'catalog:',
          'file:../other',
          'link:../other',
        ]) {
          const invalid = JSON.parse(original) as AppManifest;
          invalid.devDependencies['@nocobase/app-client'] = range;
          await writeFile(filename, JSON.stringify(invalid));
          expect(() => audit(generated)).toThrow(
            'independently installable registry range',
          );
          expect(() => audit(generated, true)).toThrow(
            'independently installable registry range',
          );
        }
        await writeFile(filename, original);
      }
      // A nested directory is not permission to import another App's source in either direction.
      for (const [file, imported] of [
        ['tests/import-boundary.ts', '../apps/sub/client/runtime.js'],
        ['apps/sub/tests/import-boundary.ts', '../../../server/runtime.js'],
        [
          'tests/import-boundary.ts',
          '../../../plugins/app-plugin-multi-app/client/index.js',
        ],
      ]) {
        const target = path.join(generated, file!);
        await writeFile(target, `import '${imported}';\n`);
        expect(() => audit(generated)).toThrow(
          'App imports must not depend on another repository or App',
        );
        expect(() => audit(generated, true)).toThrow(
          'App imports must not depend on another repository or App',
        );
        await rm(target);
      }
      const unsafeSource = path.join(
        generated,
        'tests/unsupported-reference.ts',
      );
      for (const reference of ['nocobase3-pro', 'NOCOBASE_OIDC_HTTP_ORIGIN']) {
        await writeFile(unsafeSource, `// ${reference}\n`);
        expect(() => audit(generated)).toThrow(
          'Remove repository-only references or unsupported patches',
        );
        expect(() => audit(generated, true)).toThrow(
          'Remove repository-only references or unsupported patches',
        );
      }
      await rm(unsafeSource);
      for (const app of ['.', 'apps/sub']) {
        const appRoot = path.join(generated, app);
        await rename(
          path.join(appRoot, 'gitignore'),
          path.join(appRoot, '.gitignore'),
        );
        await writeFile(
          path.join(appRoot, 'config.yml'),
          '# isolated test configuration\n',
        );
        await mkdir(path.join(appRoot, 'storage'));
        await writeFile(path.join(appRoot, 'storage/marker'), 'retained');
      }
      expect(() => audit(generated)).toThrow(
        'Do not ship local configuration or runtime data',
      );
      expect(audit(generated, true)).toContain(
        'runtime acceptance are separate',
      );
      expect(
        await readFile(path.join(generated, 'storage/marker'), 'utf8'),
      ).toBe('retained');
    },
  );
});
