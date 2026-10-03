// db-test-portability: sqlite-only — the driver runtime under test is the SQLite driver's
import { resolveDatabaseConfig } from '../src/database/resolve-config.js';
import { createAppDatabaseManager } from '../src/database/manager.js';
import { execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import ts from 'typescript';
import { expect, it } from 'vitest';

it('reports absent optional packages, supports async ESM, and preserves transitive import errors', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'async-db-drivers-'));
  try {
    const emit = (source: URL, target: string) =>
      writeFileSync(
        target,
        ts.transpileModule(readFileSync(source, 'utf8'), {
          compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2022,
          },
        }).outputText,
      );
    mkdirSync(path.join(root, 'node_modules/@nocobase/db'), {
      recursive: true,
    });
    writeFileSync(
      path.join(root, 'node_modules/@nocobase/db/package.json'),
      JSON.stringify({ type: 'module', exports: './index.js' }),
    );
    emit(
      new URL(
        '../../../libs/db/src/database/resolve-driver.ts',
        import.meta.url,
      ),
      path.join(root, 'node_modules/@nocobase/db/index.js'),
    );
    emit(
      new URL('../src/database/resolve-config.ts', import.meta.url),
      path.join(root, 'resolver.mjs'),
    );
    const run = (body: string) =>
      execFileSync(process.execPath, ['--input-type=module', '-e', body], {
        cwd: root,
        encoding: 'utf8',
      });
    const prelude = `import assert from 'node:assert/strict'; import {resolveDatabaseConfig} from './resolver.mjs'; const config = {connections:{reporting:{dialect:'mysql'}}};`;
    expect(
      run(
        prelude +
          `await assert.rejects(resolveDatabaseConfig(config), error => error.message.includes('connection "reporting"') && error.message.includes('pnpm add @nocobase/db-mysql')); console.log('missing');`,
      ).trim(),
    ).toBe('missing');
    // Every connection missing its driver is reported in one error, with one command that installs them all — a
    // driver shared by two connections is listed once.
    expect(
      run(
        `import assert from 'node:assert/strict'; import {resolveDatabaseConfig} from './resolver.mjs';` +
          `const config = {connections:{main:{dialect:'postgres'},reporting:{dialect:'mysql'},archive:{dialect:'mysql'}}};` +
          `await assert.rejects(resolveDatabaseConfig(config), error => error.name === 'MissingDatabaseDriversError'` +
          ` && error.missing.map(entry => entry.connection).join() === 'main,reporting,archive'` +
          ` && error.message.includes('"pnpm add @nocobase/db-postgres @nocobase/db-mysql"')); console.log('all missing');`,
      ).trim(),
    ).toBe('all missing');
    const mysql = path.join(root, 'node_modules/@nocobase/db-mysql');
    mkdirSync(mysql);
    writeFileSync(
      path.join(mysql, 'package.json'),
      JSON.stringify({ type: 'module', exports: { import: './index.js' } }),
    );
    writeFileSync(
      path.join(mysql, 'index.js'),
      `await Promise.resolve(); export default {dialect:'mysql'};`,
    );
    expect(
      run(
        prelude +
          `const resolved = await resolveDatabaseConfig(config); assert.equal(resolved.drivers.mysql.dialect, 'mysql'); console.log('loaded');`,
      ).trim(),
    ).toBe('loaded');
    writeFileSync(
      path.join(mysql, 'index.js'),
      `import 'missing-inner-dependency'; export default {dialect:'mysql'};`,
    );
    expect(
      run(
        prelude +
          `await assert.rejects(resolveDatabaseConfig(config), error => error.message.includes('Failed to load database driver') && error.cause.code === 'ERR_MODULE_NOT_FOUND' && error.cause.message.includes('missing-inner-dependency')); console.log('cause');`,
      ).trim(),
    ).toBe('cause');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

it.each([
  'sqlite',
  'mysql',
  'postgres',
  'mssql',
  'oracle',
  'dameng',
  'kingbase',
  'oceanbase',
])('loads the actual %s ESM factory', async (dialect) => {
  const config = await resolveDatabaseConfig({
    connections: { main: { dialect } },
  });
  expect(config.drivers[dialect].dialect).toBe(dialect);
});

it('creates a synchronous manager after async preparation and executes SQLite queries', async () => {
  const config = await resolveDatabaseConfig({
    connections: { main: { dialect: 'sqlite', filename: ':memory:' } },
  });
  const manager = createAppDatabaseManager(config)!;
  expect(manager).not.toBeInstanceOf(Promise);
  try {
    expect(manager.connection()).toBe(manager.connection());
    await manager.builder().createCollection('items', (collection) => {
      collection.increments('id');
    });
    await manager.query().insertInto('items').values({ id: 1 }).execute();
    expect(
      await manager.query().selectFrom('items').selectAll().execute(),
    ).toEqual([{ id: 1 }]);
  } finally {
    await manager.destroy();
  }
});
