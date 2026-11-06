// @vitest-environment node
import { execFileSync, spawn } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { runInNewContext } from 'node:vm';
import { build, createServer } from 'vite';
import { afterEach, expect, it, vi } from 'vitest';

import { resolveWorkspaceWatchIncludes } from '../../src/tools/scripts/dev/workspace-watches.mjs';

const require = createRequire(import.meta.url);
const tsc = require.resolve('typescript/bin/tsc');
const tsx = require.resolve('tsx/cli');
const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
});

function temporaryDirectory() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'application-workspace-'));
  roots.push(root);
  return root;
}

function write(root: string, file: string, contents: string | object) {
  const target = path.join(root, file);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(
    target,
    typeof contents === 'string' ? contents : JSON.stringify(contents),
  );
}

function pnpm(root: string, args: string[]) {
  return execFileSync('pnpm', args, {
    cwd: root,
    encoding: 'utf8',
    timeout: 30_000,
    env: { ...process.env, CI: 'true' },
  });
}

function createApplication() {
  const root = temporaryDirectory();
  write(
    root,
    'pnpm-workspace.yaml',
    "packages: ['packages/*']\nverifyDepsBeforeRun: false\nautoInstallPeers: false\n",
  );
  write(root, 'package.json', {
    name: '@fixture/root-app',
    version: '0.0.1',
    private: true,
    type: 'module',
    dependencies: { '@fixture/service': 'workspace:*' },
    devDependencies: { '@fixture/ui': 'workspace:*' },
  });
  const compilerOptions = {
    target: 'ES2022',
    module: 'NodeNext',
    moduleResolution: 'NodeNext',
    declaration: true,
    rootDir: 'src',
    outDir: 'dist',
    types: [],
    strict: true,
  };
  for (const name of ['shared', 'service', 'ui']) {
    const packageRoot = path.join(root, 'packages', name);
    write(packageRoot, 'package.json', {
      name: `@fixture/${name}`,
      version: '0.0.1',
      private: true,
      type: 'module',
      files: ['dist'],
      exports: {
        '.': { types: './dist/index.d.ts', import: './src/index.ts' },
      },
      publishConfig: {
        exports: {
          '.': { types: './dist/index.d.ts', import: './dist/index.js' },
        },
      },
      dependencies:
        name === 'shared' ? {} : { '@fixture/shared': 'workspace:*' },
      scripts: { build: 'node build.mjs' },
    });
    write(packageRoot, 'tsconfig.json', { compilerOptions, include: ['src'] });
    write(
      packageRoot,
      'build.mjs',
      `import { execFileSync } from 'node:child_process';\nexecFileSync(process.execPath, [${JSON.stringify(tsc)}, '-p', 'tsconfig.json'], { stdio: 'inherit' });\n`,
    );
    write(
      packageRoot,
      'src/index.ts',
      name === 'shared'
        ? "export const label: string = 'workspace-before';\n"
        : `import { label } from '@fixture/shared';\nexport const value: string = label;\n`,
    );
  }
  write(
    root,
    'client/index.ts',
    "import { value } from '@fixture/ui';\nexport const label = value;\n",
  );
  write(
    root,
    'server/standalone.ts',
    "import { value } from '@fixture/service';\nexport const message: string = value;\n",
  );
  write(root, 'tsconfig.server.json', {
    compilerOptions: { ...compilerOptions, rootDir: '.', outDir: 'dist' },
    include: ['server'],
  });
  pnpm(root, ['install', '--offline', '--ignore-scripts']);
  return root;
}

it('builds a root application with transitive private packages and runs its deployment outside the workspace', async () => {
  const root = createApplication();
  pnpm(root, ['--filter', '@fixture/root-app^...', 'build']);
  execFileSync(process.execPath, [tsc, '-p', 'tsconfig.server.json'], {
    cwd: root,
  });
  const client = await build({
    root,
    configFile: false,
    logLevel: 'silent',
    build: {
      write: false,
      lib: { entry: 'client/index.ts', formats: ['iife'], name: 'Fixture' },
    },
  });
  const bundle = Array.isArray(client) ? client[0] : client;
  if (!('output' in bundle)) throw new Error('Expected a client bundle.');
  const chunk = bundle.output.find((entry) => entry.type === 'chunk');
  expect(chunk).toBeDefined();
  expect(runInNewContext(`${chunk!.code}\nFixture.label`) as string).toBe(
    'workspace-before',
  );

  execFileSync(
    process.execPath,
    [
      path.resolve(
        import.meta.dirname,
        '../../src/tools/scripts/utils/build-server-dist-package.mjs',
      ),
    ],
    {
      cwd: root,
      env: { ...process.env, NOCOBASE_TOOL_ROOT: root },
    },
  );
  const deployment = temporaryDirectory();
  cpSync(path.join(root, 'dist'), deployment, { recursive: true });
  rmSync(root, { recursive: true, force: true });
  pnpm(deployment, [
    'install',
    '--offline',
    '--prod',
    '--ignore-scripts',
    '--no-lockfile',
  ]);
  expect(
    execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        "import { message } from './server/standalone.js'; console.log(message);",
      ],
      {
        cwd: deployment,
        encoding: 'utf8',
      },
    ).trim(),
  ).toBe('workspace-before');
  const manifest = JSON.parse(
    readFileSync(path.join(deployment, 'package.json'), 'utf8'),
  ) as { dependencies: Record<string, string> };
  expect(Object.keys(manifest.dependencies).sort()).toEqual([
    '@fixture/service',
    '@fixture/shared',
  ]);
}, 60_000);

it('refreshes linked client sources and restarts the server after a transitive internal source changes', async () => {
  const root = createApplication();
  write(
    root,
    'watch.mjs',
    "import { value } from '@fixture/service'; console.log(value); setInterval(() => {}, 1000);\n",
  );
  const server = await createServer({
    root,
    configFile: false,
    logLevel: 'silent',
    server: { middlewareMode: true },
  });
  const child = spawn(
    process.execPath,
    [
      tsx,
      'watch',
      '--clear-screen=false',
      '--exclude',
      `${path.parse(root).root}**/node_modules/**`,
      ...resolveWorkspaceWatchIncludes(root).flatMap((entry: string) => [
        '--include',
        entry,
      ]),
      'watch.mjs',
    ],
    { cwd: root, stdio: ['pipe', 'pipe', 'pipe'] },
  );
  let output = '';
  child.stdout.on('data', (chunk: Buffer) => {
    output += chunk.toString();
  });
  child.stderr.on('data', (chunk: Buffer) => {
    output += chunk.toString();
  });
  try {
    await vi.waitFor(() => expect(output).toContain('workspace-before'), {
      timeout: 10_000,
    });
    const before = await server.transformRequest(
      '/packages/shared/src/index.ts',
    );
    expect(before?.code).toContain('workspace-before');
    write(
      root,
      'packages/shared/src/index.ts',
      "export const label: string = 'workspace-after';\n",
    );
    await vi.waitFor(() => expect(output).toContain('workspace-after'), {
      timeout: 10_000,
    });
    await vi.waitFor(
      async () => {
        const after = await server.transformRequest(
          '/packages/shared/src/index.ts',
        );
        expect(after?.code).toContain('workspace-after');
      },
      { timeout: 10_000 },
    );
  } finally {
    await server.close();
    if (child.exitCode === null && child.signalCode === null) {
      const exited = new Promise<void>((resolve) =>
        child.once('exit', () => resolve()),
      );
      child.kill('SIGTERM');
      await exited;
    }
  }
}, 30_000);
