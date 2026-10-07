// @vitest-environment node
import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import ts from 'typescript';
import { expect, it } from 'vitest';
import metadata from '../package.json' with { type: 'json' };

const require = createRequire(import.meta.url);
const packageRoot = path.resolve(import.meta.dirname, '..');

it('typechecks published Server declarations with only declared consumer dependencies', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'file-published-types-'));
  try {
    const publishedRoot = path.join(root, 'plugin');
    const appRoot = path.join(root, 'app');
    const link = (target: string, modulesRoot: string, name: string): void => {
      const destination = path.join(modulesRoot, name);
      mkdirSync(path.dirname(destination), { recursive: true });
      symlinkSync(target, destination, 'dir');
    };
    mkdirSync(publishedRoot);
    mkdirSync(appRoot);
    writeFileSync(
      path.join(publishedRoot, 'package.json'),
      JSON.stringify({
        name: metadata.name,
        version: metadata.version,
        type: metadata.type,
        exports: metadata.publishConfig.exports,
        dependencies: metadata.dependencies,
        peerDependencies: metadata.peerDependencies,
      }),
    );
    execFileSync(
      process.execPath,
      [
        require.resolve('typescript/bin/tsc'),
        '-p',
        path.join(packageRoot, 'tsconfig.json'),
        '--emitDeclarationOnly',
        '--outDir',
        path.join(publishedRoot, 'dist'),
      ],
      { cwd: packageRoot, stdio: 'inherit' },
    );
    // Keep the package outside the App tree so workspace and App-only dependencies cannot leak in.
    for (const name of Object.keys({
      ...metadata.dependencies,
      ...metadata.peerDependencies,
    })) {
      const target = realpathSync(path.join(packageRoot, 'node_modules', name));
      link(target, path.join(publishedRoot, 'node_modules'), name);
      link(target, path.join(appRoot, 'node_modules'), name);
    }
    link(publishedRoot, path.join(appRoot, 'node_modules'), metadata.name);
    link(
      realpathSync(path.join(packageRoot, 'node_modules/@types/node')),
      path.join(appRoot, 'node_modules'),
      '@types/node',
    );
    writeFileSync(
      path.join(appRoot, 'package.json'),
      JSON.stringify({ type: 'module' }),
    );
    const entry = path.join(appRoot, 'index.ts');
    writeFileSync(
      entry,
      `import { ServiceContainer } from '@nocobase/service-provider';
import { databaseManagerToken } from '@nocobase/db';
import { driveManagerToken } from '@nocobase/app-server/drive';
import type { RepositoryPolicy } from '@nocobase/db';
import {
  FILE_COLUMNS,
  ServerFileRepositoryManager,
  defineFileRepositoryApiRoutes,
  type FileColumn,
  type ServerFileRepository,
} from '@nocobase/app-plugin-file/server';

const policy: RepositoryPolicy = {
  read: true,
  create: { scope: true },
  update: false,
  delete: false,
};

export function createFiles(container: ServiceContainer): ServerFileRepository {
  return new ServerFileRepositoryManager(
    container.resolve(databaseManagerToken),
    container.resolve(driveManagerToken),
  ).repository('attachments', {
    disk: 'local',
    accessPath: '/uploads/attachments',
    policy,
  });
}

export const columns: readonly FileColumn[] = FILE_COLUMNS;

export const routes: ReturnType<typeof defineFileRepositoryApiRoutes> =
  defineFileRepositoryApiRoutes({
    repositories: [
      { name: 'attachments', disk: 'local', policy, actions: { uploadOne: {} } },
    ],
  });
`,
    );
    const program = ts.createProgram([entry], {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.NodeNext,
      strict: true,
      skipLibCheck: false,
      noEmit: true,
      types: ['node'],
      typeRoots: [path.join(appRoot, 'node_modules/@types')],
      jsx: ts.JsxEmit.ReactJSX,
    });
    const diagnostics = ts.getPreEmitDiagnostics(program);
    expect(
      ts.formatDiagnosticsWithColorAndContext(diagnostics, {
        getCurrentDirectory: () => appRoot,
        getCanonicalFileName: (name) => name,
        getNewLine: () => '\n',
      }),
    ).toBe('');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
  // Emitting and then typechecking the whole package takes tens of seconds alone. The release test shard runs plugin
  // suites side by side, and 60 seconds was not enough there.
}, 180_000);
