/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DatabaseOptions } from '@nocobase/database';
import { exec as execCallback, execSync, spawn, spawnSync } from 'child_process';
import { createWriteStream } from 'fs';
import * as fsPromises from 'fs/promises';
import os from 'os';
import path from 'path';
import { pipeline } from 'stream/promises';
import { promisify } from 'util';
import { EscapeQuoteTransform } from '../utils';

const exec = promisify(execCallback);

const STREAM_BUFFER_SIZE = 2 * 1024 * 1024; // 2MB buffer for better IO performance

export type DBBackupOptions = {
  dir: string;
  skipFdw?: boolean;
  /**
   * @deprecated Prefer excludeTables. includeTables may miss dependent database objects.
   */
  includeTables?: string[];
  excludeTables?: string[];
};

export type DBRestoreOptions = {
  filePath: string;
  schema?: string;
  skipDropAllTables?: boolean;
  restoreMode?: 'preserveTables';
  toolchain?: DBBackupToolchain;
};

export type DBBackupToolchain = 'postgres' | 'kingbase';

export interface DBAdapter {
  dbOpts: DatabaseOptions;
  backupToolchain?: DBBackupToolchain;
  backup(options: DBBackupOptions): Promise<void>;
  restore(options: DBRestoreOptions): Promise<void>;
  check(op: 'backup' | 'restore'): Promise<void>;
  clientVersion(op: 'backup' | 'restore'): Promise<string | void>;
}

const run = async (command: string, envVars: NodeJS.ProcessEnv = {}) => {
  try {
    const result = (await exec(command, { env: { ...process.env, ...envVars } })) as unknown;
    if (typeof result === 'string') {
      return result;
    }

    if (result && typeof result === 'object' && 'stdout' in result) {
      const { stdout } = result as { stdout?: unknown };
      return typeof stdout === 'string' ? stdout : String(stdout ?? '');
    }

    return '';
  } catch (error) {
    throw new Error(`${error.message}`);
  }
};

const runSpawn = async (command: string, args: string[], envVars: NodeJS.ProcessEnv = {}) => {
  return new Promise<string>((resolve, reject) => {
    const child = spawn(command, args, {
      env: { ...process.env, ...envVars },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    let settled = false;

    child.stdout.on('data', (chunk) => stdout.push(Buffer.from(chunk)));
    child.stderr.on('data', (chunk) => stderr.push(Buffer.from(chunk)));
    child.on('error', (error) => {
      settled = true;
      reject(error);
    });
    child.on('close', (code) => {
      if (settled) {
        return;
      }
      if (code === 0) {
        settled = true;
        resolve(Buffer.concat(stdout).toString());
        return;
      }
      const errorMessage = Buffer.concat(stderr).toString().trim() || `${command} exited with code ${code}`;
      settled = true;
      reject(new Error(errorMessage));
    });
  });
};

const formatPathInEnv = (path?: string) => {
  if ((path?.startsWith('"') && path.endsWith('"')) || (path?.startsWith("'") && path.endsWith("'"))) {
    return path.slice(1, -1);
  }
  return path;
};
const escapeStringLiteral = (value: string) => String(value).replace(/'/g, "''");
const quotePgIdentifier = (value: string) => `"${String(value).replace(/"/g, '""')}"`;
const quotePgTablePattern = (table: string) => String(table).split('.').map(quotePgIdentifier).join('.');
const isPgRestoreSchemaTocEntry = (line: string) => /^\d+;\s+\d+\s+\d+\s+SCHEMA\s+-\s+/.test(line);
const parsePgTableReference = (table: string, defaultSchema?: string) => {
  const parts = String(table).split('.');
  if (parts.length > 1) {
    return {
      schema: parts[0],
      table: parts.slice(1).join('.'),
    };
  }

  return {
    schema: defaultSchema,
    table: parts[0],
  };
};
const qualifyPgTablePattern = (table: string, schema?: string) => {
  const tablePattern = String(table);
  if (!schema || tablePattern.includes('.')) {
    return tablePattern;
  }

  return `${schema}.${tablePattern}`;
};
const assertPostgresSchemaIdentifier = (schema: string) => {
  if (!/^[A-Za-z_][A-Za-z0-9_]{0,62}$/.test(schema)) {
    throw new Error(`Invalid PostgreSQL schema: ${schema}`);
  }
};

abstract class BaseDBAdapter implements DBAdapter {
  constructor(public dbOpts: DatabaseOptions) {}

  abstract backup(options: DBBackupOptions): Promise<void>;
  abstract restore(options: DBRestoreOptions): Promise<void>;

  async check(_: 'backup' | 'restore') {}
  async clientVersion(_: 'backup' | 'restore'): Promise<string | void> {}

  protected assertCommand = (command: string) => {
    const result = spawnSync(command, ['--version'], { encoding: 'utf8' });
    if (result.error || result.status !== 0) {
      throw new Error(
        `Command ${command} not found, please install it first. Check reference here: https://docs.nocobase.com/ops-management/backup-manager/`,
      );
    }
  };

  protected hasCommand(command: string) {
    const result = spawnSync(command, ['--version'], { encoding: 'utf8' });
    return !result.error && result.status === 0;
  }
}

class MySQLAdapter extends BaseDBAdapter {
  #backupCmd = 'mysqldump';
  #restoreCmd = 'mysql';
  async check(op: 'backup' | 'restore') {
    switch (op) {
      case 'backup':
        this.assertCommand(this.#backupCmd);
        this.assertCommand(this.#restoreCmd);
        break;
      case 'restore':
        this.assertCommand(this.#restoreCmd);
        break;
    }
  }

  async clientVersion(op: 'backup' | 'restore'): Promise<string | void> {
    const cmd = op === 'backup' ? this.#backupCmd : this.#restoreCmd;
    try {
      return execSync(`${cmd} --version`).toString();
    } catch (_error) {
      return undefined;
    }
  }

  async backup({ dir, skipFdw = false, includeTables, excludeTables }: DBBackupOptions): Promise<void> {
    const { username, host, port, database, password } = this.dbOpts;
    const filePath = `${dir}/data`;
    const versionStr = await this.clientVersion('backup');
    const versionMatch = (versionStr || '').match(/Ver\s+(\d+\.\d+\.\d+)/i);
    const version = versionMatch ? Number(versionMatch[1].split('.')[0]) : null;

    let createServerSQL = '';
    if (!skipFdw) {
      createServerSQL = await this.#getFederatedServerSQL(username, host, port, database, password);
    }

    const includeOption =
      Array.isArray(includeTables) && includeTables.length ? includeTables.map((table) => table) : [];
    const excludeOption =
      Array.isArray(excludeTables) && excludeTables.length
        ? excludeTables.map((table) => `--ignore-table=${database}.${table}`)
        : [];

    const mysqldumpArgs = [
      '-u',
      username,
      '-h',
      host,
      ...(port ? ['-P', port.toString()] : []),
      '--protocol=tcp',
      '--hex-blob',
      '--single-transaction',
      '--skip-lock-tables',
      '--set-gtid-purged=OFF',
      '--routines',
      '--triggers',
      '--events',
      ...(version && version > 7 ? ['--column-statistics=0'] : []),
      database,
    ];

    if (excludeOption.length) {
      mysqldumpArgs.push(...excludeOption);
    }

    if (includeOption.length) {
      mysqldumpArgs.push(...includeOption);
    }

    // Stream mysqldump output directly to final file (no intermediate file)
    return new Promise((resolve, reject) => {
      const mysqldumpProcess = spawn(this.#backupCmd, mysqldumpArgs, {
        env: { ...process.env, MYSQL_PWD: password },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      const writeStream = createWriteStream(filePath, {
        highWaterMark: STREAM_BUFFER_SIZE,
      });

      const escapeTransform = new EscapeQuoteTransform();

      // Handle errors
      mysqldumpProcess.on('error', reject);
      mysqldumpProcess.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`mysqldump exited with code ${code}`));
        }
      });

      // Write SQL headers first
      writeStream.write('/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;\n');
      writeStream.write('/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;\n');
      writeStream.write('/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;\n');
      writeStream.write('/*!40101 SET NAMES utf8mb4 */;\n\n');

      if (createServerSQL) {
        writeStream.write(`${createServerSQL}\n\n`);
      }

      // Direct streaming: mysqldump stdout -> transform -> final file
      pipeline(mysqldumpProcess.stdout, escapeTransform, writeStream)
        .then(() => {
          // Add SQL footers
          writeStream.write('\n/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;\n');
          writeStream.write('/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;\n');
          writeStream.write('/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;\n');
          writeStream.end(() => resolve());
        })
        .catch(reject);
    });
  }

  async #getFederatedServerSQL(
    username: string,
    host: string,
    port: number | undefined,
    database: string,
    password: string,
  ): Promise<string> {
    try {
      const fetchFederatedTablesCommand = `mysql -u ${username} -h ${host} ${
        port ? `-P ${port}` : ''
      } --protocol=tcp -D ${database} -e "
    SELECT TABLE_NAME
    FROM information_schema.tables
    WHERE table_schema = '${database}'
      AND engine = 'FEDERATED';" -s -N`;
      const federatedTables = (await run(fetchFederatedTablesCommand, { MYSQL_PWD: password })).trim();

      if (!federatedTables) return '';

      let servers: string[] = [];
      if (federatedTables) {
        const createTablePromises = federatedTables.split('\n').map(async (entry) => {
          const createTableCommand = `mysql -u ${username} -h ${host} ${
            port ? `-P ${port}` : ''
          } --protocol=tcp -D ${database} -e "SHOW CREATE TABLE ${entry}" -s -N`;
          const cmdRet = await run(createTableCommand, { MYSQL_PWD: password });
          const match = cmdRet.match(/ENGINE=FEDERATED\s+.*CONNECTION\s*=\s*'([^']+)\/.*?'/i);
          return match ? match[1] : '';
        });
        servers = await Promise.all(createTablePromises);
      }

      if (servers.filter((s) => s).length === 0) return '';

      const fetchServerInfoCommand = `mysql -u ${username} -h ${host} ${
        port ? `-P ${port}` : ''
      } --protocol=tcp -D ${database} -e "
    SELECT Server_name, Host, Db, Username, Password, Port FROM mysql.servers
    WHERE Server_name IN ('${servers.filter((s) => s).join("','")}');" -s -N`;
      const serverInfo = await run(fetchServerInfoCommand, { MYSQL_PWD: password });

      if (!serverInfo) return '';

      let createServerSQL = `
        DELIMITER $$
        DROP PROCEDURE IF EXISTS nocobase_create_server_if_not_exists$$
        CREATE PROCEDURE nocobase_create_server_if_not_exists()
        BEGIN
      `;
      const serverEntries = serverInfo.split('\n').filter((entry) => entry.trim() !== '');
      serverEntries.forEach((entry) => {
        const [Server_name, Host, Db, Username, Password, Port] = entry.split('\t');
        createServerSQL += `
          IF NOT EXISTS (SELECT * FROM mysql.servers WHERE Server_name = '${Server_name}') THEN
            CREATE SERVER ${Server_name} FOREIGN DATA WRAPPER mysql
            OPTIONS (HOST '${Host}', DATABASE '${Db}', USER '${Username}', PASSWORD '${Password}', PORT ${Port});
          END IF;
        `;
      });

      createServerSQL += `
        END$$
        CALL nocobase_create_server_if_not_exists()$$
        DELIMITER ;
      `;
      return createServerSQL;
    } catch (error) {
      return '';
    }
  }

  async restore({ filePath, skipDropAllTables = false, restoreMode }: DBRestoreOptions): Promise<void> {
    const { username, host, port, database, password } = this.dbOpts;

    if (restoreMode === 'preserveTables') {
      const dropViewsCommand = `mysql -u ${username} -h ${host} ${
        port ? `-P ${port}` : ''
      } --protocol=tcp -D ${database} -e "
    DELIMITER $$
    DROP PROCEDURE IF EXISTS drop_all_views$$
    CREATE PROCEDURE drop_all_views()
    BEGIN
        DECLARE _done INT DEFAULT FALSE;
        DECLARE _viewName VARCHAR(255);

        DECLARE _cursor CURSOR FOR
            SELECT table_name
            FROM information_schema.VIEWS
            WHERE table_schema = SCHEMA();

        DECLARE CONTINUE HANDLER FOR NOT FOUND SET _done = TRUE;

        OPEN _cursor;

        REPEAT
            FETCH _cursor INTO _viewName;

            IF NOT _done THEN
                SET @stmt_sql = CONCAT('DROP VIEW IF EXISTS ', _viewName);
                PREPARE stmt FROM @stmt_sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
            END IF;

        UNTIL _done END REPEAT;

        CLOSE _cursor;
    END$$

    CALL drop_all_views()$$
    DROP PROCEDURE drop_all_views$$
    DELIMITER ;
    "`;

      await run(dropViewsCommand, { MYSQL_PWD: password });
    } else if (!skipDropAllTables) {
      const dropDataCommand = `mysql -u ${username} -h ${host} ${
        port ? `-P ${port}` : ''
      } --protocol=tcp -D ${database} -e "
    DELIMITER $$
    DROP PROCEDURE IF EXISTS drop_all_tables_and_triggers$$
    CREATE PROCEDURE drop_all_tables_and_triggers()
    BEGIN
        DECLARE _done INT DEFAULT FALSE;
        DECLARE _tableName VARCHAR(255);
        DECLARE _triggerName VARCHAR(255);

        -- Cursor for tables and views
        DECLARE _cursor CURSOR FOR
            SELECT table_name
            FROM information_schema.TABLES
            WHERE table_schema = SCHEMA();

        -- Cursor for triggers
        DECLARE _trigger_cursor CURSOR FOR
            SELECT trigger_name
            FROM information_schema.TRIGGERS
            WHERE trigger_schema = SCHEMA();

        -- Handler to continue if DROP statement fails
        DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET _done = FALSE;
        DECLARE CONTINUE HANDLER FOR NOT FOUND SET _done = TRUE;

        -- Disable foreign key checks
        SET FOREIGN_KEY_CHECKS = 0;

        -- Open cursor to drop tables and views
        OPEN _cursor;

        REPEAT
            FETCH _cursor INTO _tableName;

            IF NOT _done THEN
                SET @stmt_sql1 = CONCAT('DROP TABLE IF EXISTS ', _tableName);
                SET @stmt_sql2 = CONCAT('DROP VIEW IF EXISTS ', _tableName);

                PREPARE stmt1 FROM @stmt_sql1;
                PREPARE stmt2 FROM @stmt_sql2;

                EXECUTE stmt1;
                EXECUTE stmt2;

                DEALLOCATE PREPARE stmt1;
                DEALLOCATE PREPARE stmt2;
            END IF;

        UNTIL _done END REPEAT;

        CLOSE _cursor;

        -- Reset _done for trigger deletion
        SET _done = FALSE;

        -- Open cursor to drop triggers
        OPEN _trigger_cursor;

        REPEAT
            FETCH _trigger_cursor INTO _triggerName;

            IF NOT _done THEN
                SET @stmt_sql3 = CONCAT('DROP TRIGGER IF EXISTS ', _triggerName);
                PREPARE stmt3 FROM @stmt_sql3;
                EXECUTE stmt3;
                DEALLOCATE PREPARE stmt3;
            END IF;

        UNTIL _done END REPEAT;

        CLOSE _trigger_cursor;

        -- Enable foreign key checks again
        SET FOREIGN_KEY_CHECKS = 1;
    END$$

    CALL drop_all_tables_and_triggers()$$
    DROP PROCEDURE drop_all_tables_and_triggers$$
    DELIMITER ;
    "`;

      // Run the command to drop all tables
      await run(dropDataCommand, { MYSQL_PWD: password });
    }

    const command = `${this.#restoreCmd} -u ${username} -h ${host} ${
      port ? `-P ${port}` : ''
    } --protocol=tcp ${database} < ${filePath}`;
    await run(command, { MYSQL_PWD: password });
  }
}

class PostgresAdapter extends BaseDBAdapter {
  get backupToolchain(): DBBackupToolchain {
    return 'postgres';
  }

  protected getBackupCommandName(_toolchain: DBBackupToolchain = this.backupToolchain) {
    return formatPathInEnv(process.env.PG_DUMP_PATH) || 'pg_dump';
  }

  protected getRestoreCommandName(_toolchain: DBBackupToolchain = this.backupToolchain) {
    return formatPathInEnv(process.env.PG_RESTORE_PATH) || 'pg_restore';
  }

  protected getSqlCommandName(_toolchain: DBBackupToolchain = this.backupToolchain) {
    return formatPathInEnv(process.env.PSQL_PATH) || 'psql';
  }

  protected getPasswordEnvVars(
    password: string,
    _toolchain: DBBackupToolchain = this.backupToolchain,
  ): NodeJS.ProcessEnv {
    return { PGPASSWORD: password };
  }

  protected getBackupSchema() {
    return this.dbOpts.schema;
  }

  async check(op: 'backup' | 'restore') {
    switch (op) {
      case 'backup':
        this.assertCommand(this.getBackupCommandName());
        break;
      case 'restore':
        this.assertCommand(this.getRestoreCommandName());
        break;
    }
  }

  async clientVersion(op: 'backup' | 'restore'): Promise<string | void> {
    const cmd = op === 'backup' ? this.getBackupCommandName() : this.getRestoreCommandName();
    try {
      return await runSpawn(cmd, ['--version']);
    } catch (_error) {
      return undefined;
    }
  }

  async backup({ dir, includeTables, excludeTables }: DBBackupOptions): Promise<void> {
    const { database, password } = this.dbOpts;
    const filePath = `${dir}/data`;
    const backupSchema = this.getBackupSchema();
    const expandedExcludeTables = Array.isArray(excludeTables)
      ? [...new Set([...excludeTables, ...(await this.getOwnedSequenceTables(excludeTables, backupSchema))])]
      : [];
    const includeArgs =
      Array.isArray(includeTables) && includeTables.length
        ? includeTables.flatMap((table) => ['-t', quotePgTablePattern(qualifyPgTablePattern(table, backupSchema))])
        : [];
    const excludeArgs = expandedExcludeTables.length
      ? expandedExcludeTables.flatMap((table) => [
          '-T',
          quotePgTablePattern(qualifyPgTablePattern(table, backupSchema)),
        ])
      : [];
    const args = [
      ...includeArgs,
      ...excludeArgs,
      ...this.getConnectionArgs(false),
      '-F',
      'c',
      '-b',
      '--quote-all-identifiers',
      ...(backupSchema ? [`--schema=${backupSchema}`] : []),
      '-f',
      filePath,
      database,
    ];
    await runSpawn(this.getBackupCommandName(), args, this.getPasswordEnvVars(password));
  }

  protected async getOwnedSequenceTables(
    excludeTables: string[] | undefined,
    backupSchema?: string,
  ): Promise<string[]> {
    if (!Array.isArray(excludeTables) || !excludeTables.length) {
      return [];
    }

    const tableRefs = excludeTables
      .map((table) => parsePgTableReference(table, backupSchema))
      .filter((ref) => ref.table);
    if (!tableRefs.length) {
      return [];
    }

    const values = tableRefs
      .map((ref) => {
        const schemaValue = ref.schema == null ? 'NULL' : `'${escapeStringLiteral(ref.schema)}'`;
        return `(${schemaValue}, '${escapeStringLiteral(ref.table)}')`;
      })
      .join(',');
    const query = `
      WITH excluded(schema_name, table_name) AS (VALUES ${values})
      SELECT seq_ns.nspname || '.' || seq.relname
      FROM excluded
      JOIN pg_class tbl ON tbl.relname = excluded.table_name
      JOIN pg_namespace tbl_ns ON tbl_ns.oid = tbl.relnamespace
      JOIN pg_depend dep ON dep.refobjid = tbl.oid
      JOIN pg_class seq ON seq.oid = dep.objid AND seq.relkind = 'S'
      JOIN pg_namespace seq_ns ON seq_ns.oid = seq.relnamespace
      WHERE tbl.relkind IN ('r', 'p')
        AND dep.deptype IN ('a', 'i')
        AND (excluded.schema_name IS NULL OR tbl_ns.nspname = excluded.schema_name)
    `;
    const output = String(await this.runSql(query, ['-At']));
    return output
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }

  protected getConnectionArgs(includeDatabase = true): string[] {
    const { username, host, port, database } = this.dbOpts;
    return [
      '-U',
      username,
      '-h',
      host,
      ...(port ? ['-p', String(port)] : []),
      ...(includeDatabase ? ['-d', database] : []),
    ];
  }

  protected runSql(
    query: string,
    extraArgs: string[] = [],
    toolchain: DBBackupToolchain = this.backupToolchain,
  ): Promise<string> {
    const { password } = this.dbOpts;
    return runSpawn(
      this.getSqlCommandName(toolchain),
      [...this.getConnectionArgs(), ...extraArgs, '-c', query],
      this.getPasswordEnvVars(password, toolchain),
    );
  }

  protected runRestore(args: string[], toolchain: DBBackupToolchain = this.backupToolchain): Promise<string> {
    const { password } = this.dbOpts;
    return runSpawn(this.getRestoreCommandName(toolchain), args, this.getPasswordEnvVars(password, toolchain));
  }

  async restore({
    filePath,
    schema,
    skipDropAllTables = false,
    restoreMode,
    toolchain = this.backupToolchain,
  }: DBRestoreOptions): Promise<void> {
    let schemaOption = this.dbOpts.schema;
    if (schema && !schemaOption) {
      schemaOption = 'public'; // if schema is provided, but schemaOption is not, set it to public
    }
    if (schema) {
      assertPostgresSchemaIdentifier(schema);
    }
    if (schemaOption) {
      assertPostgresSchemaIdentifier(schemaOption);
    }
    const cpuCores = os.cpus().length; // get the number of CPU cores, so we can use it to parallelize the restore
    const j = Math.max(1, Math.floor(cpuCores / 2)); // use half of the cores
    const schemaNameCondition = schemaOption
      ? `WHERE schemaname = '${schemaOption}'`
      : `WHERE schemaname NOT IN ('pg_catalog', 'information_schema')`;
    const relnamespaceCondition = schemaOption
      ? `WHERE relnamespace = '${schemaOption}'::regnamespace`
      : `WHERE tgrelid IN (SELECT oid FROM pg_class WHERE relnamespace NOT IN (SELECT oid FROM pg_catalog.pg_namespace WHERE nspname IN ('pg_catalog', 'information_schema')))`;
    if (restoreMode === 'preserveTables') {
      const dropViewsQuery = `
    DO $$ DECLARE r RECORD;
    BEGIN
    FOR r IN (
      SELECT schemaname, viewname, false AS materialized FROM pg_views ${schemaNameCondition}
      UNION ALL
      SELECT schemaname, matviewname AS viewname, true AS materialized FROM pg_matviews ${schemaNameCondition}
    ) LOOP
      BEGIN
        IF r.materialized THEN
          EXECUTE 'DROP MATERIALIZED VIEW IF EXISTS ' || quote_ident(r.schemaname) || '.' || quote_ident(r.viewname) || ' CASCADE';
        ELSE
          EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(r.schemaname) || '.' || quote_ident(r.viewname) || ' CASCADE';
        END IF;
      EXCEPTION
        WHEN OTHERS THEN
      END;
    END LOOP;
    END $$;`;

      await this.runSql(dropViewsQuery, [], toolchain);
    } else if (!skipDropAllTables) {
      const dropDataQuery = `
    DO $$ DECLARE r RECORD;
    BEGIN
    FOR r IN (SELECT viewname,schemaname FROM pg_views ${schemaNameCondition}) LOOP
        BEGIN
          EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(r.schemaname) || '.' || quote_ident(r.viewname) || ' CASCADE';
        EXCEPTION
          WHEN OTHERS THEN
        END;
    END LOOP;

    FOR r IN (SELECT tablename,schemaname FROM pg_tables ${schemaNameCondition}) LOOP
      BEGIN
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename) || ' CASCADE';
      EXCEPTION
        WHEN OTHERS THEN
      END;
    END LOOP;

    FOR r IN (SELECT sequencename,schemaname FROM pg_sequences ${schemaNameCondition}) LOOP
      BEGIN
        EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.schemaname) || '.' || quote_ident(r.sequencename) || ' CASCADE';
      EXCEPTION
        WHEN OTHERS THEN
      END;
    END LOOP;

    FOR r IN (
      SELECT tgname, tgrelid::regclass::text AS table_fullname
      FROM pg_trigger
      WHERE tgrelid IN (SELECT oid FROM pg_class ${relnamespaceCondition})
    ) LOOP
      BEGIN
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.tgname) || ' ON ' || quote_ident(r.table_fullname) || ' CASCADE';
      EXCEPTION
        WHEN OTHERS THEN
      END;
    END LOOP;

    END $$;`;

      // Run the command to drop all existing data
      await this.runSql(dropDataQuery, [], toolchain);
    }

    if (schema === schemaOption || !schemaOption) {
      // current schema is the same as the backup schema
      // In preserveTables mode, excluded tables must stay in the target schema.
      // pg_restore --clean would otherwise try to drop/create the schema itself
      // because the schema object is part of the archive TOC, and that fails as
      // long as preserved tables still depend on the schema. Use a filtered TOC
      // list to skip only the SCHEMA entry while keeping --clean for tables,
      // views, sequences, indexes, constraints, and other archived objects.
      // Risk: the target schema must already exist, and the filter must stay
      // narrow enough to avoid removing COMMENT/ACL/TABLE entries that mention
      // SCHEMA.
      const restoreList =
        restoreMode === 'preserveTables' ? await this.createRestoreListWithoutSchema(filePath, toolchain) : undefined;
      const restoreArgs = [
        ...this.getConnectionArgs(),
        '--clean',
        '--if-exists',
        '--no-owner',
        '-j',
        String(j),
        ...(restoreList ? ['-L', restoreList.filePath] : []),
        filePath,
      ];
      try {
        await this.runRestore(restoreArgs, toolchain);
      } finally {
        if (restoreList) {
          await fsPromises.unlink(restoreList.filePath).catch(() => {});
        }
      }
    } else {
      const srcSchema = schema || 'public';
      const pgRestoreArgs = this.buildSchemaRestoreArgs(srcSchema, schemaOption, filePath, j, toolchain);
      await this.restoreSchema(srcSchema, schemaOption, pgRestoreArgs, toolchain);
    }
  }

  protected async createRestoreListWithoutSchema(
    filePath: string,
    toolchain: DBBackupToolchain = this.backupToolchain,
  ): Promise<{ filePath: string }> {
    const listOutput = String(await this.runRestore(['--list', filePath], toolchain));
    const filteredList = listOutput
      .split('\n')
      .filter((line) => !isPgRestoreSchemaTocEntry(line))
      .join('\n');
    const listFilePath = path.join(
      os.tmpdir(),
      `nocobase-pg-restore-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.list`,
    );
    await fsPromises.writeFile(listFilePath, filteredList);
    return {
      filePath: listFilePath,
    };
  }

  protected buildSchemaRestoreArgs(
    srcSchema: string,
    _targetSchema: string,
    filePath: string,
    jobs: number,
    _toolchain: DBBackupToolchain = this.backupToolchain,
  ) {
    return [
      ...this.getConnectionArgs(),
      '-n',
      srcSchema,
      '--clean',
      '--if-exists',
      '--no-owner',
      '-j',
      String(jobs),
      filePath,
    ];
  }

  protected async restoreSchema(
    srcSchema: string,
    targetSchema: string,
    pgRestoreArgs: string[],
    toolchain: DBBackupToolchain = this.backupToolchain,
  ) {
    const ts = Date.now();
    // 1. backup current schema to srcSchema_ts if exists and create new schema (same name as srcSchema)
    const preQuery = `
    DO $$
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = '${srcSchema}') THEN
            EXECUTE 'ALTER SCHEMA ${srcSchema} RENAME TO ${srcSchema}_${ts}';
        END IF;
        EXECUTE 'CREATE SCHEMA ${srcSchema}';
    END $$;`;
    const postQuery = `
    DO $$
    BEGIN
        EXECUTE 'DROP SCHEMA ${targetSchema} CASCADE';
        EXECUTE 'ALTER SCHEMA ${srcSchema} RENAME TO ${targetSchema}';
        IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = '${srcSchema}_${ts}') THEN
            EXECUTE 'ALTER SCHEMA ${srcSchema}_${ts} RENAME TO ${srcSchema}';
        END IF;
    END $$;`;

    await this.runSql(preQuery, [], toolchain);
    try {
      await this.runRestore(pgRestoreArgs, toolchain);
    } finally {
      await this.runSql(postQuery, [], toolchain);
    }
    await this.syncCollectionSchemaMetadata(srcSchema, targetSchema, toolchain);
  }

  protected async syncCollectionSchemaMetadata(
    srcSchema: string,
    targetSchema: string,
    toolchain: DBBackupToolchain = this.backupToolchain,
  ) {
    const { tablePrefix } = this.dbOpts;
    const collectionsTable = `${tablePrefix || ''}collections`;
    const targetSchemaLiteral = escapeStringLiteral(targetSchema);
    const srcSchemaLiteral = escapeStringLiteral(srcSchema);
    const collectionsTableLiteral = escapeStringLiteral(collectionsTable);
    const updateCollectionSchemaQuery = `
    DO $$
    DECLARE
        collections_table text := '${collectionsTableLiteral}';
    BEGIN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = '${targetSchemaLiteral}'
              AND table_name = collections_table
              AND column_name = 'options'
        ) THEN
            EXECUTE format(
              'UPDATE %I.%I SET options = jsonb_set(options::jsonb, ''{schema}'', to_jsonb(%L::text), true) WHERE options->>''schema'' = %L',
              '${targetSchemaLiteral}',
              collections_table,
              '${targetSchemaLiteral}',
              '${srcSchemaLiteral}'
            );
        END IF;
    END $$;`;
    await this.runSql(updateCollectionSchemaQuery, [], toolchain);
  }
}

class KingbaseAdapter extends PostgresAdapter {
  get backupToolchain(): DBBackupToolchain {
    return this.hasKingbaseToolchain() ? 'kingbase' : 'postgres';
  }

  private getKingbaseBackupCommandName() {
    return formatPathInEnv(process.env.KINGBASE_DUMP_PATH) || 'sys_dump';
  }

  private getKingbaseRestoreCommandName() {
    return formatPathInEnv(process.env.KINGBASE_RESTORE_PATH) || 'sys_restore';
  }

  private getKingbaseSqlCommandName() {
    return formatPathInEnv(process.env.KINGBASE_PSQL_PATH) || 'ksql';
  }

  private hasKingbaseToolchain() {
    return (
      this.hasCommand(this.getKingbaseBackupCommandName()) &&
      this.hasCommand(this.getKingbaseRestoreCommandName()) &&
      this.hasCommand(this.getKingbaseSqlCommandName())
    );
  }

  protected getBackupCommandName(toolchain: DBBackupToolchain = this.backupToolchain) {
    return toolchain === 'kingbase' ? this.getKingbaseBackupCommandName() : super.getBackupCommandName(toolchain);
  }

  protected getRestoreCommandName(toolchain: DBBackupToolchain = this.backupToolchain) {
    return toolchain === 'kingbase' ? this.getKingbaseRestoreCommandName() : super.getRestoreCommandName(toolchain);
  }

  protected getSqlCommandName(toolchain: DBBackupToolchain = this.backupToolchain) {
    return toolchain === 'kingbase' ? this.getKingbaseSqlCommandName() : super.getSqlCommandName(toolchain);
  }

  protected getPasswordEnvVars(
    password: string,
    toolchain: DBBackupToolchain = this.backupToolchain,
  ): NodeJS.ProcessEnv {
    if (toolchain === 'postgres') {
      return super.getPasswordEnvVars(password, toolchain);
    }
    return { KINGBASE_PASSWORD: password };
  }

  protected getBackupSchema() {
    return this.dbOpts.schema || 'public';
  }

  protected buildSchemaRestoreArgs(
    srcSchema: string,
    targetSchema: string,
    filePath: string,
    jobs: number,
    toolchain: DBBackupToolchain = this.backupToolchain,
  ) {
    if (toolchain === 'postgres') {
      return super.buildSchemaRestoreArgs(srcSchema, targetSchema, filePath, jobs, toolchain);
    }
    return [
      ...this.getConnectionArgs(),
      '-g',
      srcSchema,
      '-G',
      targetSchema,
      '--clean',
      '--if-exists',
      '--no-owner',
      '-j',
      String(jobs),
      filePath,
    ];
  }

  protected async restoreSchema(
    srcSchema: string,
    targetSchema: string,
    restoreArgs: string[],
    toolchain: DBBackupToolchain = this.backupToolchain,
  ) {
    if (toolchain === 'postgres') {
      await super.restoreSchema(srcSchema, targetSchema, restoreArgs, toolchain);
      return;
    }

    const targetSchemaIdentifier = quotePgIdentifier(targetSchema);

    await this.runSql(`CREATE SCHEMA IF NOT EXISTS ${targetSchemaIdentifier};`, [], toolchain);
    await this.runRestore(restoreArgs, toolchain);
    await this.syncCollectionSchemaMetadata(srcSchema, targetSchema, toolchain);
  }
}

class SQLiteAdapter extends BaseDBAdapter {
  async backup({ dir }: DBBackupOptions): Promise<void> {
    const { storage } = this.dbOpts;
    const filePath = `${dir}/data`;
    const dbFilePath = path.resolve(storage);
    // const command = `cp ${storage} ${filePath}`; // not cross-platform, so we use node fs instead
    await fsPromises.copyFile(dbFilePath, filePath);
  }

  async restore({ filePath }: DBRestoreOptions): Promise<void> {
    const { storage } = this.dbOpts;
    const dbFilePath = path.resolve(storage);
    await fsPromises.copyFile(filePath, dbFilePath, fsPromises.constants.COPYFILE_FICLONE);
  }
}

class MariaDBAdapter extends MySQLAdapter {}

const adapterMap = {
  mysql: MySQLAdapter,
  postgres: PostgresAdapter,
  kingbase: KingbaseAdapter,
  sqlite: SQLiteAdapter,
  mariadb: MariaDBAdapter,
};

export function getDBAdapter(dbOpts: DatabaseOptions): DBAdapter {
  const Adapter = adapterMap[dbOpts.dialect];
  if (!Adapter) {
    throw new Error(`Unsupported database type ${dbOpts.dialect}`);
  }
  return new Adapter(dbOpts);
}
