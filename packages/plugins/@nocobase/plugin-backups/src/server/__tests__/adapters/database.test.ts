/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as cp from 'child_process';
import os from 'os';
import { getDBAdapter } from '../../adapters/database';
import { Mock } from 'vitest';
import * as fsPromises from 'fs/promises';
import { DatabaseOptions } from '@nocobase/database';
import fs from 'fs';

import { EventEmitter } from 'events';
import { Readable, Writable } from 'stream';

vi.mock('child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof cp>();
  return {
    ...actual,
    execSync: vi.fn(),
    exec: vi.fn(),
    spawn: vi.fn().mockImplementation(() => {
      const stdout = new Readable({
        read() {
          this.push(null);
        },
      });
      const stderr = new Readable({
        read() {
          this.push(null);
        },
      });
      const stdin = new Writable({
        write(_chunk, _encoding, callback) {
          callback();
        },
      });
      const cp = new EventEmitter() as any;
      cp.stdout = stdout;
      cp.stderr = stderr;
      cp.stdin = stdin;
      setTimeout(() => {
        cp.emit('exit', 0);
        cp.emit('close', 0);
      }, 10);
      return cp;
    }),
  };
});

vi.mock('fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof fsPromises>();
  return {
    ...actual,
    copyFile: vi.fn(),
  };
});

describe('DatabaseAdapter', () => {
  const dbOpts: DatabaseOptions = {
    dialect: 'postgres',
    username: 'test',
    password: 'test',
    database: 'test',
    host: 'localhost',
    port: 5432,
  };

  describe('PostgresAdapter', () => {
    it('check function without client installed', async () => {
      // mock the child_process.execSync function
      (cp.execSync as Mock).mockImplementation((_command, _callback) => {
        throw new Error('Command not found');
      });

      const adapter = getDBAdapter(dbOpts);
      await expect(adapter.check('backup')).rejects.toThrowError('Command pg_dump not found, please install it first');
      await expect(adapter.check('restore')).rejects.toThrow('Command pg_restore not found, please install it first');
    });

    it('check function with client installed', async () => {
      // mock the child_process.execSync function
      (cp.execSync as Mock).mockImplementation((_command, _callback) => {
        return 'PostgreSQL 16.1';
      });

      const adapter = getDBAdapter(dbOpts);
      expect(adapter.check('backup')).resolves.toBeUndefined();
      expect(adapter.check('restore')).resolves.toBeUndefined();
    });

    it('backup function', async () => {
      const mockedExec = cp.exec as unknown as Mock;
      mockedExec.mockImplementation((_command, _options, callback) => {
        callback(null, { stdout: 'done' });
      });
      const adapter = getDBAdapter(dbOpts);
      const dir = os.tmpdir();
      await adapter.backup({ dir });
      expect(mockedExec.mock.lastCall[0]).toContain('pg_dump');
    });

    it('backup function with included and excluded tables', async () => {
      const mockedExec = cp.exec as unknown as Mock;
      mockedExec.mockClear();
      mockedExec.mockImplementation((_command, _options, callback) => {
        callback(null, { stdout: 'done' });
      });
      const adapter = getDBAdapter(dbOpts);
      const dir = os.tmpdir();
      await adapter.backup({
        dir,
        includeTables: ['users', 'posts'],
        excludeTables: ['logs', 'audit_logs'],
      });
      const command = mockedExec.mock.lastCall[0];
      expect(command).toContain('pg_dump');
      expect(command).toContain(`-t '"users"' -t '"posts"'`);
      expect(command).toContain(`-T '"logs"' -T '"audit_logs"'`);
    });

    it('backup function should quote mixed-case included and excluded tables', async () => {
      const mockedExec = cp.exec as unknown as Mock;
      mockedExec.mockClear();
      mockedExec.mockImplementation((_command, _options, callback) => {
        callback(null, { stdout: 'done' });
      });
      const adapter = getDBAdapter(dbOpts);
      const dir = os.tmpdir();
      await adapter.backup({
        dir,
        includeTables: ['applicationPlugins', 'public.rolesUsers'],
        excludeTables: ['dataSourcesCollections'],
      });
      const command = mockedExec.mock.lastCall[0];
      expect(command).toContain(`-t '"applicationPlugins"'`);
      expect(command).toContain(`-t '"public"."rolesUsers"'`);
      expect(command).toContain(`-T '"dataSourcesCollections"'`);
    });

    it('backup function should qualify included and excluded tables with configured schema', async () => {
      const mockedExec = cp.exec as unknown as Mock;
      mockedExec.mockClear();
      mockedExec.mockImplementation((_command, _options, callback) => {
        callback(null, { stdout: 'done' });
      });
      const adapter = getDBAdapter({
        ...dbOpts,
        schema: 'test_version_control',
      });
      const dir = os.tmpdir();
      await adapter.backup({
        dir,
        includeTables: ['applicationPlugins', 'public.rolesUsers'],
        excludeTables: ['dataSourcesCollections'],
      });
      const command = mockedExec.mock.lastCall[0];
      expect(command).toContain(`-t '"test_version_control"."applicationPlugins"'`);
      expect(command).toContain(`-t '"public"."rolesUsers"'`);
      expect(command).toContain(`-T '"test_version_control"."dataSourcesCollections"'`);
      expect(command).toContain(`--schema=test_version_control`);
    });

    it('restore function', async () => {
      const mockedExec = cp.exec as unknown as Mock;
      mockedExec.mockImplementation((_command, _options, callback) => {
        callback(null, { stdout: 'done' });
      });
      const adapter = getDBAdapter(dbOpts);
      const filePath = os.tmpdir();
      await adapter.restore({ filePath });
      expect(mockedExec.mock.lastCall[0]).toContain('pg_restore');
    });

    it('restore function should skip dropping all tables when skipDropAllTables is true', async () => {
      const mockedExec = cp.exec as unknown as Mock;
      mockedExec.mockClear();
      mockedExec.mockImplementation((_command, _options, callback) => {
        callback(null, { stdout: 'done' });
      });
      const adapter = getDBAdapter(dbOpts);
      const filePath = os.tmpdir();
      await adapter.restore({ filePath, skipDropAllTables: true });

      const commands = mockedExec.mock.calls.map(([command]) => command);
      expect(commands).toHaveLength(1);
      expect(commands[0]).toContain('pg_restore');
      expect(commands.some((command) => command.includes('DROP TABLE IF EXISTS'))).toBe(false);
      expect(commands.some((command) => command.includes('DROP VIEW IF EXISTS'))).toBe(false);
      expect(commands.some((command) => command.includes('DROP TRIGGER IF EXISTS'))).toBe(false);
    });

    it('restore function should sync collection schema metadata when schema is renamed', async () => {
      const mockedExec = cp.exec as unknown as Mock;
      mockedExec.mockClear();
      mockedExec.mockImplementation((_command, _options, callback) => {
        callback(null, { stdout: 'done' });
      });
      const adapter = getDBAdapter({
        ...dbOpts,
        schema: 'public',
        tablePrefix: 'nb_',
      });

      await adapter.restore({ filePath: os.tmpdir(), schema: 'source_schema' });

      const commands = mockedExec.mock.calls.map(([command]) => command);
      expect(commands.some((command) => command.includes('jsonb_set') && command.includes('nb_collections'))).toBe(
        true,
      );
      expect(commands.some((command) => command.includes("'public'") && command.includes("'source_schema'"))).toBe(
        true,
      );
    });

    it('restore function should reject unsafe source schema names before running commands', async () => {
      const mockedExec = cp.exec as unknown as Mock;
      mockedExec.mockClear();
      mockedExec.mockImplementation((_command, _options, callback) => {
        callback(null, { stdout: 'done' });
      });
      const adapter = getDBAdapter({
        ...dbOpts,
        schema: 'target_schema',
      });

      await expect(
        adapter.restore({
          filePath: os.tmpdir(),
          schema: 'safe; touch /tmp/nocobase-cve-marker #',
          skipDropAllTables: true,
        }),
      ).rejects.toThrow(/invalid PostgreSQL schema/i);

      expect(mockedExec).not.toHaveBeenCalled();
    });

    it('restore function should reject unsafe target schema names before running commands', async () => {
      const mockedExec = cp.exec as unknown as Mock;
      mockedExec.mockClear();
      mockedExec.mockImplementation((_command, _options, callback) => {
        callback(null, { stdout: 'done' });
      });
      const adapter = getDBAdapter({
        ...dbOpts,
        schema: 'target; touch /tmp/nocobase-cve-marker #',
      });

      await expect(
        adapter.restore({
          filePath: os.tmpdir(),
          schema: 'source_schema',
          skipDropAllTables: true,
        }),
      ).rejects.toThrow(/invalid PostgreSQL schema/i);

      expect(mockedExec).not.toHaveBeenCalled();
    });

    it('restore function should not sync collection schema metadata when schema is unchanged', async () => {
      const mockedExec = cp.exec as unknown as Mock;
      mockedExec.mockClear();
      mockedExec.mockImplementation((_command, _options, callback) => {
        callback(null, { stdout: 'done' });
      });
      const adapter = getDBAdapter({
        ...dbOpts,
        schema: 'public',
      });

      await adapter.restore({ filePath: os.tmpdir(), schema: 'public' });

      const commands = mockedExec.mock.calls.map(([command]) => command);
      expect(commands.some((command) => command.includes('jsonb_set'))).toBe(false);
    });
  });

  describe('KingbaseAdapter', () => {
    const dbOpts: DatabaseOptions = {
      dialect: 'kingbase',
      username: 'test',
      password: 'secret',
      database: 'test',
      host: 'localhost',
      port: 54321,
    } as DatabaseOptions;

    it('uses Kingbase client tools by default', async () => {
      const mockedExec = cp.exec as unknown as Mock;
      mockedExec.mockClear();
      mockedExec.mockImplementation((_command, _options, callback) => {
        callback(null, { stdout: 'done' });
      });
      const adapter = getDBAdapter(dbOpts);
      const dir = os.tmpdir();

      await adapter.backup({ dir });
      await adapter.restore({ filePath: os.tmpdir(), skipDropAllTables: true });

      expect(adapter.backupToolchain).toBe('kingbase');
      expect(mockedExec.mock.calls[0][0]).toContain('sys_dump');
      expect(mockedExec.mock.calls[0][0]).toContain('--schema=public');
      expect(mockedExec.mock.calls[0][1].env).toEqual(expect.objectContaining({ KINGBASE_PASSWORD: 'secret' }));
      expect(mockedExec.mock.calls[1][0]).toContain('sys_restore');
      expect(mockedExec.mock.calls[1][1].env).toEqual(expect.objectContaining({ KINGBASE_PASSWORD: 'secret' }));
    });

    it('falls back to PostgreSQL client tools when Kingbase tools are missing', async () => {
      (cp.execSync as Mock).mockImplementation((command) => {
        if (
          String(command).includes('sys_dump') ||
          String(command).includes('sys_restore') ||
          String(command).includes('ksql')
        ) {
          throw new Error('Command not found');
        }
        return 'PostgreSQL 16.1';
      });
      const mockedExec = cp.exec as unknown as Mock;
      mockedExec.mockClear();
      mockedExec.mockImplementation((_command, _options, callback) => {
        callback(null, { stdout: 'done' });
      });
      const adapter = getDBAdapter(dbOpts);

      await adapter.backup({ dir: os.tmpdir() });
      await adapter.restore({ filePath: os.tmpdir(), skipDropAllTables: true });

      expect(adapter.backupToolchain).toBe('postgres');
      expect(mockedExec.mock.calls[0][0]).toContain('pg_dump');
      expect(mockedExec.mock.calls[1][0]).toContain('pg_restore');
    });

    it('uses sys_restore schema remapping for Kingbase backup toolchain', async () => {
      (cp.execSync as Mock).mockImplementation(() => 'KingbaseES V009R001C010');
      const mockedExec = cp.exec as unknown as Mock;
      mockedExec.mockClear();
      mockedExec.mockImplementation((_command, _options, callback) => {
        callback(null, { stdout: 'done' });
      });
      const adapter = getDBAdapter({
        ...dbOpts,
        schema: 'target_schema',
      } as DatabaseOptions);

      await adapter.restore({ filePath: os.tmpdir(), schema: 'source_schema', skipDropAllTables: true });

      const commands = mockedExec.mock.calls.map(([command]) => command);
      expect(commands.some((command) => command.includes('CREATE SCHEMA IF NOT EXISTS \\"target_schema\\"'))).toBe(
        true,
      );
      expect(commands.some((command) => command.includes('sys_restore') && command.includes('-g source_schema'))).toBe(
        true,
      );
      expect(commands.some((command) => command.includes('-G target_schema'))).toBe(true);
      expect(commands.some((command) => command.includes('jsonb_set'))).toBe(true);
    });
  });

  describe('MySQLAdapter', () => {
    const dbOpts: DatabaseOptions = {
      dialect: 'mysql',
      username: 'test',
      password: 'test',
      database: 'test',
      host: 'localhost',
      port: 3306,
    };

    it('check function without client installed', async () => {
      // mock the child_process.execSync function
      (cp.execSync as Mock).mockImplementation((_command, _callback) => {
        throw new Error('Command not found');
      });

      const adapter = getDBAdapter(dbOpts);
      await expect(adapter.check('backup')).rejects.toThrowError(
        'Command mysqldump not found, please install it first',
      );
      await expect(adapter.check('restore')).rejects.toThrow('Command mysql not found, please install it first');
    });

    it('check function with client installed', async () => {
      // mock the child_process.execSync function
      (cp.execSync as Mock).mockImplementation((_command, _callback) => {
        return 'MySQL 8.0';
      });

      const adapter = getDBAdapter(dbOpts);
      expect(adapter.check('backup')).resolves.toBeUndefined();
      expect(adapter.check('restore')).resolves.toBeUndefined();
    });

    it('backup function', async () => {
      const mockedSpawn = cp.spawn as unknown as Mock;
      const adapter = getDBAdapter(dbOpts);
      const dir = os.tmpdir();
      await adapter.backup({ dir });
      fs.promises.unlink(`${dir}/data`).catch(() => {});
      expect(mockedSpawn).toHaveBeenCalledWith('mysqldump', expect.anything(), expect.anything());
    });

    it('backup function with included and excluded tables', async () => {
      const mockedSpawn = cp.spawn as unknown as Mock;
      mockedSpawn.mockClear();
      const adapter = getDBAdapter(dbOpts);
      const dir = os.tmpdir();
      await adapter.backup({
        dir,
        includeTables: ['users', 'posts'],
        excludeTables: ['logs', 'audit_logs'],
      });
      fs.promises.unlink(`${dir}/data`).catch(() => {});
      expect(mockedSpawn).toHaveBeenCalledWith(
        'mysqldump',
        expect.arrayContaining([
          'test',
          '--ignore-table=test.logs',
          '--ignore-table=test.audit_logs',
          'users',
          'posts',
        ]),
        expect.anything(),
      );
    });

    it('restore function', async () => {
      const mockedExec = cp.exec as unknown as Mock;
      mockedExec.mockImplementation((_command, _options, callback) => {
        callback(null, { stdout: 'done' });
      });
      const adapter = getDBAdapter(dbOpts);
      const filePath = os.tmpdir();
      await adapter.restore({ filePath });
      expect(mockedExec.mock.lastCall[0]).toContain('mysql');
    });

    it('restore function should skip dropping all tables when skipDropAllTables is true', async () => {
      const mockedExec = cp.exec as unknown as Mock;
      mockedExec.mockClear();
      mockedExec.mockImplementation((_command, _options, callback) => {
        callback(null, { stdout: 'done' });
      });
      const adapter = getDBAdapter(dbOpts);
      const filePath = os.tmpdir();
      await adapter.restore({ filePath, skipDropAllTables: true });

      const commands = mockedExec.mock.calls.map(([command]) => command);
      expect(commands).toHaveLength(1);
      expect(commands[0]).toContain('mysql');
      expect(commands[0]).toContain(` < ${filePath}`);
      expect(commands.some((command) => command.includes('drop_all_tables_and_triggers'))).toBe(false);
    });
  });

  describe('MariaDBAdapter', () => {
    const dbOpts: DatabaseOptions = {
      dialect: 'mariadb',
      username: 'test',
      password: 'test',
      database: 'test',
      host: 'localhost',
      port: 3306,
    };

    it('check function without client installed', async () => {
      // mock the child_process.execSync function
      (cp.execSync as Mock).mockImplementation((_command, _callback) => {
        throw new Error('Command not found');
      });

      const adapter = getDBAdapter(dbOpts);
      await expect(adapter.check('backup')).rejects.toThrowError(
        'Command mysqldump not found, please install it first',
      );
      await expect(adapter.check('restore')).rejects.toThrow('Command mysql not found, please install it first');
    });

    it('check function with client installed', async () => {
      // mock the child_process.execSync function
      (cp.execSync as Mock).mockImplementation((_command, _callback) => {
        return 'MariaDB 10.6';
      });

      const adapter = getDBAdapter(dbOpts);
      expect(adapter.check('backup')).resolves.toBeUndefined();
      expect(adapter.check('restore')).resolves.toBeUndefined();
    });

    it('backup function', async () => {
      const mockedSpawn = cp.spawn as unknown as Mock;
      // mock the child_process.execSync function
      (cp.execSync as Mock).mockImplementation((_command, _callback) => {
        return 'MySQL 8.0';
      });
      const adapter = getDBAdapter(dbOpts);
      const dir = os.tmpdir();
      await adapter.backup({ dir });
      fs.promises.unlink(`${dir}/data`).catch(() => {});
      expect(mockedSpawn).toHaveBeenCalledWith('mysqldump', expect.anything(), expect.anything());
    });

    it('backup function with included and excluded tables', async () => {
      const mockedSpawn = cp.spawn as unknown as Mock;
      mockedSpawn.mockClear();
      (cp.execSync as Mock).mockImplementation((_command, _callback) => {
        return 'MySQL 8.0';
      });
      const adapter = getDBAdapter(dbOpts);
      const dir = os.tmpdir();
      await adapter.backup({
        dir,
        includeTables: ['users', 'posts'],
        excludeTables: ['logs', 'audit_logs'],
      });
      fs.promises.unlink(`${dir}/data`).catch(() => {});
      expect(mockedSpawn).toHaveBeenCalledWith(
        'mysqldump',
        expect.arrayContaining([
          'test',
          '--ignore-table=test.logs',
          '--ignore-table=test.audit_logs',
          'users',
          'posts',
        ]),
        expect.anything(),
      );
    });

    it('restore function', async () => {
      const mockedExec = cp.exec as unknown as Mock;
      mockedExec.mockImplementation((_command, _options, callback) => {
        callback(null, { stdout: 'done' });
      });
      const adapter = getDBAdapter(dbOpts);
      const filePath = os.tmpdir();
      await adapter.restore({ filePath });
      expect(mockedExec.mock.lastCall[0]).toContain('mysql');
    });

    it('restore function should skip dropping all tables when skipDropAllTables is true', async () => {
      const mockedExec = cp.exec as unknown as Mock;
      mockedExec.mockClear();
      mockedExec.mockImplementation((_command, _options, callback) => {
        callback(null, { stdout: 'done' });
      });
      const adapter = getDBAdapter(dbOpts);
      const filePath = os.tmpdir();
      await adapter.restore({ filePath, skipDropAllTables: true });

      const commands = mockedExec.mock.calls.map(([command]) => command);
      expect(commands).toHaveLength(1);
      expect(commands[0]).toContain('mysql');
      expect(commands[0]).toContain(` < ${filePath}`);
      expect(commands.some((command) => command.includes('drop_all_tables_and_triggers'))).toBe(false);
    });
  });

  describe('SQLiteAdapter', () => {
    const dbOpts: DatabaseOptions = {
      dialect: 'sqlite',
      storage: 'database.sqlite',
    };

    it('check function passed', async () => {
      const adapter = getDBAdapter(dbOpts);
      await expect(adapter.check('backup')).resolves.toBeUndefined();
      await expect(adapter.check('restore')).resolves.toBeUndefined();
    });

    it('backup function', async () => {
      const mockedCopyFile = fsPromises.copyFile as Mock;
      mockedCopyFile.mockImplementation((_src, _dest) => {});
      const adapter = getDBAdapter(dbOpts);
      const dir = os.tmpdir();
      await adapter.backup({ dir });
      expect(mockedCopyFile.mock.lastCall[0]).toContain('database.sqlite');
    });

    it('restore function', async () => {
      const mockedCopyFile = fsPromises.copyFile as Mock;
      mockedCopyFile.mockImplementation((_src, _dest) => {});
      const adapter = getDBAdapter(dbOpts);
      const dir = os.tmpdir();
      await adapter.restore({ filePath: dir });
      expect(mockedCopyFile.mock.lastCall[0]).toContain(dir);
    });
  });
});
