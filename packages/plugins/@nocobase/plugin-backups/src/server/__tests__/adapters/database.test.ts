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
    exec: vi.fn().mockImplementation((_command, _options, callback) => {
      callback(null, { stdout: '' });
    }),
    spawnSync: vi.fn().mockReturnValue({ status: 0, stdout: 'PostgreSQL 16.1', stderr: '' }),
    spawn: vi.fn().mockImplementation((command, args = []) => {
      const stdoutText =
        (String(command).includes('pg_restore') || String(command).includes('sys_restore')) &&
        Array.isArray(args) &&
        args.includes('--list')
          ? [
              '; Archive created at 2026-06-18 00:00:00',
              '123; 2615 2200 SCHEMA - public test',
              '124; 0 0 COMMENT - SCHEMA public test',
              '125; 0 0 ACL - SCHEMA public test',
              '126; 1259 2201 TABLE public users test',
            ].join('\n')
          : (String(command).includes('psql') || String(command).includes('ksql')) &&
              Array.isArray(args) &&
              args.some((arg) => String(arg).includes('pg_depend'))
            ? 'public.logs_id_seq\n'
            : '';
      const stdout = Readable.from(stdoutText ? [stdoutText] : []);
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
    writeFile: vi.fn().mockResolvedValue(undefined),
    unlink: vi.fn().mockResolvedValue(undefined),
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
      (cp.spawnSync as Mock).mockReturnValue({ error: new Error('Command not found'), status: 1 });

      const adapter = getDBAdapter(dbOpts);
      await expect(adapter.check('backup')).rejects.toThrowError('Command pg_dump not found, please install it first');
      await expect(adapter.check('restore')).rejects.toThrow('Command pg_restore not found, please install it first');
    });

    it('check function with client installed', async () => {
      (cp.spawnSync as Mock).mockReturnValue({ status: 0, stdout: 'PostgreSQL 16.1', stderr: '' });

      const adapter = getDBAdapter(dbOpts);
      expect(adapter.check('backup')).resolves.toBeUndefined();
      expect(adapter.check('restore')).resolves.toBeUndefined();
    });

    it('backup function', async () => {
      const mockedSpawn = cp.spawn as unknown as Mock;
      mockedSpawn.mockClear();
      const adapter = getDBAdapter(dbOpts);
      const dir = os.tmpdir();
      await adapter.backup({ dir });
      expect(mockedSpawn.mock.lastCall[0]).toBe('pg_dump');
      expect(mockedSpawn.mock.lastCall[1]).toEqual(
        expect.arrayContaining(['-U', 'test', '-h', 'localhost', '-p', '5432', '-F', 'c', '-f', `${dir}/data`, 'test']),
      );
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
      const [command, args] = mockedSpawn.mock.lastCall;
      expect(command).toBe('pg_dump');
      expect(args).toEqual(
        expect.arrayContaining(['-t', '"users"', '-t', '"posts"', '-T', '"logs"', '-T', '"audit_logs"']),
      );
    });

    it('backup function should quote mixed-case included and excluded tables', async () => {
      const mockedSpawn = cp.spawn as unknown as Mock;
      mockedSpawn.mockClear();
      const adapter = getDBAdapter(dbOpts);
      const dir = os.tmpdir();
      await adapter.backup({
        dir,
        includeTables: ['applicationPlugins', 'public.rolesUsers'],
        excludeTables: ['dataSourcesCollections'],
      });
      const args = mockedSpawn.mock.lastCall[1];
      expect(args).toEqual(
        expect.arrayContaining([
          '-t',
          '"applicationPlugins"',
          '-t',
          '"public"."rolesUsers"',
          '-T',
          '"dataSourcesCollections"',
        ]),
      );
    });

    it('backup function should qualify included and excluded tables with configured schema', async () => {
      const mockedSpawn = cp.spawn as unknown as Mock;
      mockedSpawn.mockClear();
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
      const args = mockedSpawn.mock.lastCall[1];
      expect(args).toEqual(
        expect.arrayContaining([
          '-t',
          '"test_version_control"."applicationPlugins"',
          '-t',
          '"public"."rolesUsers"',
          '-T',
          '"test_version_control"."dataSourcesCollections"',
          '--schema=test_version_control',
        ]),
      );
    });

    it('backup function should exclude owned sequences for excluded tables', async () => {
      const mockedSpawn = cp.spawn as unknown as Mock;
      mockedSpawn.mockClear();
      const adapter = getDBAdapter(dbOpts);
      const dir = os.tmpdir();
      await adapter.backup({
        dir,
        excludeTables: ['logs'],
      });
      const [sequenceCommand, sequenceArgs] = mockedSpawn.mock.calls[0];
      expect(sequenceCommand).toBe('psql');
      expect(sequenceArgs).toEqual(expect.arrayContaining(['-At', '-c']));
      expect(sequenceArgs[sequenceArgs.indexOf('-c') + 1]).toContain('pg_depend');

      const args = mockedSpawn.mock.lastCall[1];
      expect(args).toEqual(expect.arrayContaining(['-T', '"logs"', '-T', '"public"."logs_id_seq"']));
    });

    it('restore function', async () => {
      const mockedSpawn = cp.spawn as unknown as Mock;
      mockedSpawn.mockClear();
      const adapter = getDBAdapter(dbOpts);
      const filePath = os.tmpdir();
      await adapter.restore({ filePath });
      expect(mockedSpawn.mock.lastCall[0]).toBe('pg_restore');
      expect(mockedSpawn.mock.lastCall[1]).toEqual(expect.arrayContaining(['-d', 'test', '--clean', filePath]));
    });

    it('restore function should skip dropping all tables when skipDropAllTables is true', async () => {
      const mockedSpawn = cp.spawn as unknown as Mock;
      mockedSpawn.mockClear();
      const adapter = getDBAdapter(dbOpts);
      const filePath = os.tmpdir();
      await adapter.restore({ filePath, skipDropAllTables: true });

      expect(mockedSpawn).toHaveBeenCalledTimes(1);
      expect(mockedSpawn.mock.calls[0][0]).toBe('pg_restore');
    });

    it('restore function should preserve tables and drop views when restoreMode is preserveTables', async () => {
      const mockedSpawn = cp.spawn as unknown as Mock;
      const mockedWriteFile = fsPromises.writeFile as Mock;
      const mockedUnlink = fsPromises.unlink as Mock;
      mockedSpawn.mockClear();
      mockedWriteFile.mockClear();
      mockedUnlink.mockClear();
      const adapter = getDBAdapter(dbOpts);
      const filePath = os.tmpdir();
      await adapter.restore({ filePath, restoreMode: 'preserveTables' });

      expect(mockedSpawn).toHaveBeenCalledTimes(3);
      const dropQuery = mockedSpawn.mock.calls[0][1][mockedSpawn.mock.calls[0][1].indexOf('-c') + 1];
      expect(dropQuery).toContain('DROP VIEW IF EXISTS');
      expect(dropQuery).toContain('DROP MATERIALIZED VIEW IF EXISTS');
      expect(dropQuery).not.toContain('DROP TABLE IF EXISTS');
      expect(dropQuery).not.toContain('DROP SEQUENCE IF EXISTS');
      expect(dropQuery).not.toContain('DROP TRIGGER IF EXISTS');
      expect(mockedSpawn.mock.calls[1][0]).toBe('pg_restore');
      expect(mockedSpawn.mock.calls[1][1]).toEqual(['--list', filePath]);
      expect(mockedSpawn.mock.calls[2][0]).toBe('pg_restore');
      expect(mockedSpawn.mock.calls[2][1]).toEqual(expect.arrayContaining(['-L', expect.any(String), filePath]));
      expect(mockedWriteFile).toHaveBeenCalledTimes(1);
      expect(mockedWriteFile.mock.calls[0][1]).not.toContain('SCHEMA - public');
      expect(mockedWriteFile.mock.calls[0][1]).toContain('COMMENT - SCHEMA public');
      expect(mockedWriteFile.mock.calls[0][1]).toContain('ACL - SCHEMA public');
      expect(mockedWriteFile.mock.calls[0][1]).toContain('TABLE public users');
      expect(mockedUnlink).toHaveBeenCalledTimes(1);
    });

    it('restore function should sync collection schema metadata when schema is renamed', async () => {
      const mockedSpawn = cp.spawn as unknown as Mock;
      mockedSpawn.mockClear();
      const adapter = getDBAdapter({
        ...dbOpts,
        schema: 'public',
        tablePrefix: 'nb_',
      });

      await adapter.restore({ filePath: os.tmpdir(), schema: 'source_schema' });

      const queries = mockedSpawn.mock.calls
        .filter(([command]) => command === 'psql')
        .map(([, args]) => args[args.indexOf('-c') + 1]);
      expect(queries.some((query) => query.includes('jsonb_set') && query.includes('nb_collections'))).toBe(true);
      expect(queries.some((query) => query.includes("'public'") && query.includes("'source_schema'"))).toBe(true);
    });

    it('restore function should reject unsafe source schema names before running commands', async () => {
      const mockedSpawn = cp.spawn as unknown as Mock;
      mockedSpawn.mockClear();
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

      expect(mockedSpawn).not.toHaveBeenCalled();
    });

    it('restore function should reject unsafe target schema names before running commands', async () => {
      const mockedSpawn = cp.spawn as unknown as Mock;
      mockedSpawn.mockClear();
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

      expect(mockedSpawn).not.toHaveBeenCalled();
    });

    it('restore function should not sync collection schema metadata when schema is unchanged', async () => {
      const mockedSpawn = cp.spawn as unknown as Mock;
      mockedSpawn.mockClear();
      const adapter = getDBAdapter({
        ...dbOpts,
        schema: 'public',
      });

      await adapter.restore({ filePath: os.tmpdir(), schema: 'public' });

      const queries = mockedSpawn.mock.calls
        .filter(([command]) => command === 'psql')
        .map(([, args]) => args[args.indexOf('-c') + 1]);
      expect(queries.some((query) => query.includes('jsonb_set'))).toBe(false);
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
      (cp.spawnSync as Mock).mockReturnValue({ status: 0, stdout: 'KingbaseES V009R001C010', stderr: '' });
      const mockedSpawn = cp.spawn as unknown as Mock;
      mockedSpawn.mockClear();
      const adapter = getDBAdapter(dbOpts);
      const dir = os.tmpdir();

      await adapter.backup({ dir });
      await adapter.restore({ filePath: os.tmpdir(), skipDropAllTables: true });

      expect(adapter.backupToolchain).toBe('kingbase');
      expect(mockedSpawn.mock.calls[0][0]).toBe('sys_dump');
      expect(mockedSpawn.mock.calls[0][1]).toContain('--schema=public');
      expect(mockedSpawn.mock.calls[0][2].env).toEqual(expect.objectContaining({ KINGBASE_PASSWORD: 'secret' }));
      expect(mockedSpawn.mock.calls[1][0]).toBe('sys_restore');
      expect(mockedSpawn.mock.calls[1][2].env).toEqual(expect.objectContaining({ KINGBASE_PASSWORD: 'secret' }));
    });

    it('falls back to PostgreSQL client tools when Kingbase tools are missing', async () => {
      (cp.spawnSync as Mock).mockImplementation((command) => {
        if (
          String(command).includes('sys_dump') ||
          String(command).includes('sys_restore') ||
          String(command).includes('ksql')
        ) {
          return { error: new Error('Command not found'), status: 1 };
        }
        return { status: 0, stdout: 'PostgreSQL 16.1', stderr: '' };
      });
      const mockedSpawn = cp.spawn as unknown as Mock;
      mockedSpawn.mockClear();
      const adapter = getDBAdapter(dbOpts);

      await adapter.backup({ dir: os.tmpdir() });
      await adapter.restore({ filePath: os.tmpdir(), skipDropAllTables: true });

      expect(adapter.backupToolchain).toBe('postgres');
      expect(mockedSpawn.mock.calls[0][0]).toBe('pg_dump');
      expect(mockedSpawn.mock.calls[1][0]).toBe('pg_restore');
    });

    it('uses sys_restore schema remapping for Kingbase backup toolchain', async () => {
      (cp.spawnSync as Mock).mockReturnValue({ status: 0, stdout: 'KingbaseES V009R001C010', stderr: '' });
      const mockedSpawn = cp.spawn as unknown as Mock;
      mockedSpawn.mockClear();
      const adapter = getDBAdapter({
        ...dbOpts,
        schema: 'target_schema',
      } as DatabaseOptions);

      await adapter.restore({ filePath: os.tmpdir(), schema: 'source_schema', skipDropAllTables: true });

      const queries = mockedSpawn.mock.calls
        .filter(([command]) => command === 'ksql')
        .map(([, args]) => args[args.indexOf('-c') + 1]);
      const restoreCall = mockedSpawn.mock.calls.find(([command]) => command === 'sys_restore');
      expect(queries.some((query) => query.includes('CREATE SCHEMA IF NOT EXISTS "target_schema"'))).toBe(true);
      expect(restoreCall?.[1]).toEqual(expect.arrayContaining(['-g', 'source_schema', '-G', 'target_schema']));
      expect(queries.some((query) => query.includes('jsonb_set'))).toBe(true);
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
      (cp.spawnSync as Mock).mockReturnValue({ error: new Error('Command not found'), status: 1 });

      const adapter = getDBAdapter(dbOpts);
      await expect(adapter.check('backup')).rejects.toThrowError(
        'Command mysqldump not found, please install it first',
      );
      await expect(adapter.check('restore')).rejects.toThrow('Command mysql not found, please install it first');
    });

    it('check function with client installed', async () => {
      (cp.spawnSync as Mock).mockReturnValue({ status: 0, stdout: 'MySQL 8.0', stderr: '' });

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

    it('restore function should preserve tables and drop views when restoreMode is preserveTables', async () => {
      const mockedExec = cp.exec as unknown as Mock;
      mockedExec.mockClear();
      mockedExec.mockImplementation((_command, _options, callback) => {
        callback(null, { stdout: 'done' });
      });
      const adapter = getDBAdapter(dbOpts);
      const filePath = os.tmpdir();
      await adapter.restore({ filePath, restoreMode: 'preserveTables' });

      const commands = mockedExec.mock.calls.map(([command]) => command);
      expect(commands).toHaveLength(2);
      expect(commands[0]).toContain('drop_all_views');
      expect(commands[0]).toContain('DROP VIEW IF EXISTS');
      expect(commands[0]).not.toContain('drop_all_tables_and_triggers');
      expect(commands[1]).toContain('mysql');
      expect(commands[1]).toContain(` < ${filePath}`);
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
      (cp.spawnSync as Mock).mockReturnValue({ error: new Error('Command not found'), status: 1 });

      const adapter = getDBAdapter(dbOpts);
      await expect(adapter.check('backup')).rejects.toThrowError(
        'Command mysqldump not found, please install it first',
      );
      await expect(adapter.check('restore')).rejects.toThrow('Command mysql not found, please install it first');
    });

    it('check function with client installed', async () => {
      (cp.spawnSync as Mock).mockReturnValue({ status: 0, stdout: 'MariaDB 10.6', stderr: '' });

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

    it('restore function should preserve tables and drop views when restoreMode is preserveTables', async () => {
      const mockedExec = cp.exec as unknown as Mock;
      mockedExec.mockClear();
      mockedExec.mockImplementation((_command, _options, callback) => {
        callback(null, { stdout: 'done' });
      });
      const adapter = getDBAdapter(dbOpts);
      const filePath = os.tmpdir();
      await adapter.restore({ filePath, restoreMode: 'preserveTables' });

      const commands = mockedExec.mock.calls.map(([command]) => command);
      expect(commands).toHaveLength(2);
      expect(commands[0]).toContain('drop_all_views');
      expect(commands[0]).toContain('DROP VIEW IF EXISTS');
      expect(commands[0]).not.toContain('drop_all_tables_and_triggers');
      expect(commands[1]).toContain('mysql');
      expect(commands[1]).toContain(` < ${filePath}`);
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
