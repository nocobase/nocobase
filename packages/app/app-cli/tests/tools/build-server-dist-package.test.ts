// @vitest-environment node

import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

const scriptPath = path.resolve(
  import.meta.dirname,
  '../../src/tools/scripts/utils/build-server-dist-package.mjs',
);
const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function writeJson(filePath: string, value: unknown): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(value, null, 2));
}

/**
 * A miniature monorepo: `packages/<group>/<name>`, with the application under `packages/templates/app` so the
 * script's grouped workspace scan finds the plugin and library beside it, the way it does in this repository.
 */
function createWorkspace() {
  const workspace = mkdtempSync(
    path.join(os.tmpdir(), 'nocobase-dist-package-'),
  );
  temporaryDirectories.push(workspace);
  const packages = path.join(workspace, 'packages');
  const root = path.join(packages, 'templates', 'app');
  const plugin = path.join(packages, 'plugins', 'plugin-demo');
  const library = path.join(packages, 'libs', 'lib');

  writeJson(path.join(root, 'package.json'), {
    name: '@fixture/app',
    version: '1.2.3',
    engines: { node: '>=24.0.0' },
    nocobase: { templateKind: 'app' },
    dependencies: {
      '@fixture/plugin-demo': 'workspace:^',
      pg: '^8.0.0',
    },
    devDependencies: {
      vitest: '^3.0.0',
      // A driver reaches the server through knex rather than an import, so a declared one is added wherever it is
      // declared — `create-app` puts exactly one in place for the chosen dialect.
      'better-sqlite3': '~12.0.0',
    },
    peerDependencies: { react: '^19.0.0' },
  });
  mkdirSync(path.join(root, 'dist', 'server'), { recursive: true });
  // Installed versions win over declared ranges, so the deployment installs what was tested here.
  writeJson(path.join(root, 'node_modules', 'pg', 'package.json'), {
    name: 'pg',
    version: '8.11.3',
  });

  writeJson(path.join(plugin, 'package.json'), {
    name: '@fixture/plugin-demo',
    displayName: 'Demo',
    version: '0.1.0',
    type: 'module',
    exports: { '.': './src/index.ts' },
    publishConfig: { exports: { '.': './dist/index.js' } },
    dependencies: { hono: '^4.5.0', '@fixture/lib': 'workspace:^' },
    optionalDependencies: { sharp: '^0.33.0' },
    peerDependencies: { '@nocobase/app-server': 'workspace:^', react: '^19' },
    devDependencies: { typescript: '^5.0.0' },
    scripts: { build: 'tsc' },
  });
  mkdirSync(path.join(plugin, 'dist'), { recursive: true });
  writeFileSync(path.join(plugin, 'dist', 'index.js'), 'export {};\n');

  writeJson(path.join(library, 'package.json'), {
    name: '@fixture/lib',
    version: '0.2.0',
    type: 'module',
    // A published file kept beside `dist`, reached through `exports`, as `@nocobase/cli-envelope`'s guard is.
    exports: { '.': './dist/index.js', './guard': './guard.js' },
    files: ['dist', 'guard.js', 'guard.d.ts', 'docs/', 'src/**/*.ts'],
    dependencies: {},
  });
  mkdirSync(path.join(library, 'dist'), { recursive: true });
  writeFileSync(path.join(library, 'dist', 'index.js'), 'export {};\n');
  writeFileSync(path.join(library, 'guard.js'), 'export {};\n');
  mkdirSync(path.join(library, 'docs'), { recursive: true });
  writeFileSync(path.join(library, 'docs', 'README.md'), '# lib\n');
  mkdirSync(path.join(library, 'src'), { recursive: true });
  writeFileSync(path.join(library, 'src', 'index.ts'), 'export {};\n');

  return { root, plugin, library };
}

function generate(root: string) {
  return spawnSync(process.execPath, [scriptPath], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, NOCOBASE_TOOL_ROOT: root },
    timeout: 20_000,
  });
}

function readJson(filePath: string): Record<string, unknown> {
  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>;
}

describe('server package generation', () => {
  it('lists declared dependencies, follows workspace packages into vendor, and skips dev and peer packages', () => {
    const { root } = createWorkspace();

    const result = generate(root);

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain(
      'Generated dist/package.json with 6 production dependencies and 2 vendored workspace packages.',
    );

    const manifest = readJson(path.join(root, 'dist', 'package.json'));
    expect(manifest).toMatchObject({
      name: '@fixture/app',
      version: '1.2.3',
      private: true,
      type: 'module',
      nocobase: { templateKind: 'app' },
      main: './server/embedded.js',
      exports: {
        '.': './server/embedded.js',
        './embedded': './server/embedded.js',
        './standalone': './server/standalone.js',
      },
      scripts: {
        start: 'node ./server/standalone.js',
        nocobase: 'node ./cli/index.js',
      },
      engines: { node: '>=24.0.0' },
    });
    // External packages sorted first, then vendored workspace packages by `file:` path; nothing from
    // devDependencies or peerDependencies of either the application or the plugin.
    expect(manifest.dependencies).toEqual({
      'better-sqlite3': '12.0.0',
      hono: '4.5.0',
      pg: '8.11.3',
      sharp: '0.33.0',
      '@fixture/lib': 'file:vendor/@fixture/lib',
      '@fixture/plugin-demo': 'file:vendor/@fixture/plugin-demo',
    });
    expect(Object.keys(manifest.dependencies as object)).toEqual([
      'better-sqlite3',
      'hono',
      'pg',
      'sharp',
      '@fixture/lib',
      '@fixture/plugin-demo',
    ]);
    expect(manifest).not.toHaveProperty('devDependencies');
    expect(manifest).not.toHaveProperty('peerDependencies');
  });

  it('vendors the compiled output with a runtime manifest', () => {
    const { root } = createWorkspace();

    expect(generate(root).status).toBe(0);

    const vendorDir = path.join(
      root,
      'dist',
      'vendor',
      '@fixture',
      'plugin-demo',
    );
    expect(existsSync(path.join(vendorDir, 'dist', 'index.js'))).toBe(true);
    expect(
      existsSync(
        path.join(
          root,
          'dist',
          'vendor',
          '@fixture',
          'lib',
          'dist',
          'index.js',
        ),
      ),
    ).toBe(true);
    const vendored = readJson(path.join(vendorDir, 'package.json'));
    expect(vendored).toEqual({
      name: '@fixture/plugin-demo',
      displayName: 'Demo',
      version: '0.1.0',
      private: true,
      type: 'module',
      exports: { '.': './dist/index.js' },
    });
  });

  it('vendors every path a workspace package publishes, so an export beside dist does not dangle', () => {
    const { root } = createWorkspace();

    expect(generate(root).status).toBe(0);

    const vendorDir = path.join(root, 'dist', 'vendor', '@fixture', 'lib');
    // Named in `files` and present: copied, whether a file or a directory.
    expect(existsSync(path.join(vendorDir, 'guard.js'))).toBe(true);
    expect(existsSync(path.join(vendorDir, 'docs', 'README.md'))).toBe(true);
    // Named but absent, or a glob: skipped, never an error.
    expect(existsSync(path.join(vendorDir, 'guard.d.ts'))).toBe(false);
    expect(existsSync(path.join(vendorDir, 'src'))).toBe(false);
    expect(readJson(path.join(vendorDir, 'package.json')).exports).toEqual({
      '.': './dist/index.js',
      './guard': './guard.js',
    });
  });

  it('writes the pnpm settings the deployment installs with', () => {
    const { root } = createWorkspace();

    expect(generate(root).status).toBe(0);

    const workspace = readFileSync(
      path.join(root, 'dist', 'pnpm-workspace.yaml'),
      'utf8',
    );
    expect(workspace).toContain('nodeLinker: hoisted');
    expect(workspace).toContain('autoInstallPeers: false');
    expect(workspace).toContain('verifyDepsBeforeRun: false');
    expect(workspace).toMatch(/allowBuilds:\n(?:.*\n)*? {2}oracledb: true/);
    expect(workspace).toMatch(/ {2}tesseract\.js: false/);
    expect(workspace).toMatch(/ {2}better-sqlite3: false/);
  });

  it("carries the application's registry settings, and nothing else, into dist/.npmrc", () => {
    const { root } = createWorkspace();
    writeFileSync(
      path.join(root, '.npmrc'),
      [
        '@nocobase:registry=https://npm.example.test',
        'strict-peer-dependencies=false',
        '//npm.example.test/:_authToken=secret-token',
        '  registry = https://registry.example.test/',
        '',
      ].join('\n'),
    );

    expect(generate(root).status).toBe(0);

    const npmrc = readFileSync(path.join(root, 'dist', '.npmrc'), 'utf8');
    expect(npmrc).toContain('@nocobase:registry=https://npm.example.test');
    expect(npmrc).toContain('registry = https://registry.example.test/');
    expect(npmrc).not.toContain('secret-token');
    expect(npmrc).not.toContain('strict-peer-dependencies');
  });

  it('writes no dist/.npmrc when the application names no registry', () => {
    const { root } = createWorkspace();
    writeFileSync(
      path.join(root, '.npmrc'),
      'strict-peer-dependencies=false\n',
    );

    expect(generate(root).status).toBe(0);
    expect(existsSync(path.join(root, 'dist', '.npmrc'))).toBe(false);
  });

  it('adds only the database drivers the application declares', () => {
    const { root } = createWorkspace();
    const manifestPath = path.join(root, 'package.json');
    const manifest = readJson(manifestPath);
    manifest.dependencies = { pg: '^8.0.0' };
    manifest.devDependencies = {};
    writeJson(manifestPath, manifest);

    const result = generate(root);

    expect(result.status).toBe(0);
    const dependencies = readJson(path.join(root, 'dist', 'package.json'))
      .dependencies as Record<string, string>;
    expect(Object.keys(dependencies)).toEqual(['pg']);
    expect(existsSync(path.join(root, 'dist', 'vendor'))).toBe(false);
  });

  it('fails when dist/server has not been built', () => {
    const { root } = createWorkspace();
    rmSync(path.join(root, 'dist', 'server'), { recursive: true });

    const result = generate(root);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      'Missing dist/server. Run pnpm build first.',
    );
  });

  it('fails when a workspace package has no compiled output to vendor', () => {
    const { root, library } = createWorkspace();
    rmSync(path.join(library, 'dist'), { recursive: true });

    const result = generate(root);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      'Build @fixture/lib before generating the server package.',
    );
    expect(existsSync(path.join(root, 'dist', 'package.json'))).toBe(false);
  });

  it('fails when an external dependency has neither a declared nor an installed version', () => {
    const { root, plugin } = createWorkspace();
    const manifestPath = path.join(plugin, 'package.json');
    const manifest = readJson(manifestPath);
    manifest.dependencies = { hono: '', '@fixture/lib': 'workspace:^' };
    writeJson(manifestPath, manifest);

    const result = generate(root);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      'Could not find a declared or installed version for hono',
    );
  });
});
