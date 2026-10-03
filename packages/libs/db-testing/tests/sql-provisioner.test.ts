import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createDatabaseManager, rawRows } from '@nocobase/db';
import { createSqlTestDatabaseProvisioner } from '@nocobase/db/testing';
import { sqlite, sqliteDriver } from '@nocobase/db-sqlite';
import type { Knex } from 'knex';
import { afterEach, describe, expect, it } from 'vitest';

// The helper is exercised on SQLite, where a table stands in for the database a server dialect creates: the
// statements are the helper's to run, whatever they create.
describe('createSqlTestDatabaseProvisioner', () => {
  const directories: string[] = [];
  afterEach(() => {
    for (const directory of directories.splice(0)) {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  const serverFile = (): string => {
    const directory = mkdtempSync(path.join(tmpdir(), 'nbt-sql-provisioner-'));
    directories.push(directory);
    return path.join(directory, 'server.sqlite');
  };

  const tables = async (filename: string): Promise<string[]> => {
    const database = createDatabaseManager({
      connections: { main: sqlite({ filename }) },
    });
    try {
      const client = await database.connection().client<Knex>();
      return rawRows<{ name: string }>(
        await client.raw(
          "select name from sqlite_schema where type = 'table' order by name",
        ),
      ).map((row) => row.name);
    } finally {
      await database.destroy();
    }
  };

  it('drops what earlier create statements made when a later one fails', async () => {
    const filename = serverFile();
    const provisioner = createSqlTestDatabaseProvisioner({
      dialect: 'sqlite',
      capabilities: sqliteDriver.capabilities ?? {},
      admin: () => sqlite({ filename }),
      connection: () => sqlite({ filename }),
      statements: {
        create: [
          'create table ?? (id integer)',
          'insert into missing_table values (?)',
        ],
        drop: 'drop table if exists ??',
        list: "select name from sqlite_schema where type = 'table'",
      },
    });

    await expect(
      provisioner.provision({ name: 'nbt_partial', env: {} }),
    ).rejects.toThrow(/missing_table/);
    await expect(tables(filename)).resolves.not.toContain('nbt_partial');
  });

  it('leaves alone what a failing first statement could not have made', async () => {
    const filename = serverFile();
    const setup = createDatabaseManager({
      connections: { main: sqlite({ filename }) },
    });
    try {
      const client = await setup.connection().client<Knex>();
      await client.raw('create table nbt_existing (id integer)');
    } finally {
      await setup.destroy();
    }
    const provisioner = createSqlTestDatabaseProvisioner({
      dialect: 'sqlite',
      capabilities: sqliteDriver.capabilities ?? {},
      admin: () => sqlite({ filename }),
      connection: () => sqlite({ filename }),
      statements: {
        create: ['create table ?? (id integer)', 'select 1'],
        drop: 'drop table if exists ??',
        list: "select name from sqlite_schema where type = 'table'",
      },
    });

    await expect(
      provisioner.provision({ name: 'nbt_existing', env: {} }),
    ).rejects.toThrow(/already exists/);
    await expect(tables(filename)).resolves.toContain('nbt_existing');
  });
});
