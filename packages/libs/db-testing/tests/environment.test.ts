import { describe, expect, it, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  createTestDatabase,
  loadTestDatabaseProvisioner,
  TestDatabaseConfigurationError,
  testDatabaseCapabilities,
  testDatabaseDialect,
  testDatabasePackage,
} from '../src/index.js';

describe('the dialect a test runs on', () => {
  it('is SQLite unless the environment names another', () => {
    expect(testDatabaseDialect({})).toBe('sqlite');
    expect(testDatabaseDialect({ NOCOBASE_TEST_DB_DIALECT: ' ' })).toBe(
      'sqlite',
    );
    expect(testDatabaseDialect({ NOCOBASE_TEST_DB_DIALECT: 'postgres' })).toBe(
      'postgres',
    );
  });

  it('rejects a value that cannot be a dialect name', () => {
    expect(() =>
      testDatabaseDialect({ NOCOBASE_TEST_DB_DIALECT: 'Postgres;' }),
    ).toThrow(TestDatabaseConfigurationError);
  });

  it('is provisioned by the dialect package it names', async () => {
    expect(testDatabasePackage('mysql')).toBe('@nocobase/db-mysql');
    await expect(loadTestDatabaseProvisioner('sqlite')).resolves.toMatchObject({
      dialect: 'sqlite',
    });
  });

  it('names the package to install when the dialect is not installed', async () => {
    await expect(loadTestDatabaseProvisioner('nonexistent')).rejects.toThrow(
      /needs @nocobase\/db-nonexistent/,
    );
  });
});

describe('testDatabaseCapabilities', () => {
  it('matches what a connection on the selected dialect reports', async () => {
    const testDatabase = await createTestDatabase();
    try {
      await expect(testDatabaseCapabilities()).resolves.toEqual(
        testDatabase.capabilities,
      );
    } finally {
      await testDatabase.destroy();
    }
  });
});

it('loads an external driver from the consuming project without a peer dependency', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'external-db-provisioner-'));
  const packageDir = path.join(
    root,
    'node_modules/@nocobase/db-externalfixture',
  );
  mkdirSync(packageDir, { recursive: true });
  writeFileSync(
    path.join(packageDir, 'package.json'),
    JSON.stringify({
      name: '@nocobase/db-externalfixture',
      type: 'module',
      exports: { './testing': { import: './testing.js' } },
    }),
  );
  writeFileSync(
    path.join(packageDir, 'testing.js'),
    "export const testDatabaseProvisioner = { dialect: 'externalfixture' };\n",
  );
  const cwd = vi.spyOn(process, 'cwd').mockReturnValue(root);
  try {
    await expect(
      loadTestDatabaseProvisioner('externalfixture'),
    ).resolves.toMatchObject({ dialect: 'externalfixture' });
  } finally {
    cwd.mockRestore();
    rmSync(root, { recursive: true, force: true });
  }
});
