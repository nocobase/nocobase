import { DatabaseOptions } from '@nocobase/database';
import { exec as execCallback, execSync, spawn } from 'child_process';
import { createReadStream, createWriteStream } from 'fs';
import * as fsPromises from 'fs/promises';
import os from 'os';
import path from 'path';
import { pipeline } from 'stream/promises';
import { promisify } from 'util';
import { EscapeQuoteTransform } from '../utils';

const exec = promisify(execCallback);
const D$$ = os.platform() === 'win32' ? '$$' : '\\$\\$';

const STREAM_BUFFER_SIZE = 2 * 1024 * 1024; // 2MB buffer for better IO performance

export interface DBAdapter {
  dbOpts: DatabaseOptions;
  backup(dir: string, skipFdw?: boolean): Promise<void>;
  restore(filePath: string, schema?: string): Promise<void>;
  check(op: 'backup' | 'restore'): Promise<void>;
  clientVersion(op: 'backup' | 'restore'): Promise<string | void>;
}

const run = async (command: string, envVars: NodeJS.ProcessEnv = {}) => {
  try {
    const { stdout } = await exec(command, { env: { ...process.env, ...envVars } });
    return stdout;
  } catch (error) {
    throw new Error(`${error.message}`);
  }
};

const formatPathInEnv = (path?: string) => {
  if (path && /\s/.test(path) && !/^".*"$/.test(path) && !/^'.*'$/.test(path)) {
    return `"${path}"`;
  }
  return path;
};
const escapeStringLiteral = (value: string) => String(value).replace(/'/g, "''");

abstract class BaseDBAdapter implements DBAdapter {
  constructor(public dbOpts: DatabaseOptions) {}

  abstract backup(dir: string, skipFdw?: boolean): Promise<void>;
  abstract restore(filePath: string): Promise<void>;

  async check(_: 'backup' | 'restore') {}
  async clientVersion(_: 'backup' | 'restore'): Promise<string | void> {}

  protected assertCommand = (command: string) => {
    try {
      execSync(`${command} --version`);
    } catch (error) {
      throw new Error(
        `Command ${command} not found, please install it first. Check reference here: https://docs.nocobase.com/handbook/backups#installation`,
      );
    }
  };
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
    } catch (_error) {}
  }

  async backup(dir: string, skipFdw: boolean = false): Promise<void> {
    const { username, host, port, database, password } = this.dbOpts;
    const filePath = `${dir}/data`;
    const versionStr = await this.clientVersion('backup');
    const versionMatch = (versionStr || '').match(/Ver\s+(\d+\.\d+\.\d+)/i);
    const version = versionMatch ? Number(versionMatch[1].split('.')[0]) : null;
    
    let createServerSQL = '';
    if (!skipFdw) {
      createServerSQL = await this.#getFederatedServerSQL(username, host, port, database, password);
    }

    const mysqldumpArgs = [
      '-u', username,
      '-h', host,
      ...(port ? ['-P', port.toString()] : []),
      '--protocol=tcp',
      '--hex-blob',
      '--single-transaction',
      '--skip-lock-tables',
      '--set-gtid-purged=OFF',
      '--routines',
      '--triggers',
      ...(version && version > 7 ? ['--column-statistics=0'] : []),
      database
    ];

    // Stream mysqldump output directly to final file (no intermediate file)
    return new Promise((resolve, reject) => {
      const mysqldumpProcess = spawn(this.#backupCmd, mysqldumpArgs, {
        env: { ...process.env, MYSQL_PWD: password },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const writeStream = createWriteStream(filePath, {
        highWaterMark: STREAM_BUFFER_SIZE
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
      pipeline(
        mysqldumpProcess.stdout,
        escapeTransform,
        writeStream
      ).then(() => {
        // Add SQL footers
        writeStream.write('\n/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;\n');
        writeStream.write('/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;\n');
        writeStream.write('/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;\n');
        writeStream.end(() => resolve());
      }).catch(reject);
    });
  }

  async #getFederatedServerSQL(username: string, host: string, port: number | undefined, database: string, password: string): Promise<string> {
    try {
      const fetchFederatedTablesCommand = `mysql -u ${username} -h ${host} ${port ? `-P ${port}` : ''
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
          const createTableCommand = `mysql -u ${username} -h ${host} ${port ? `-P ${port}` : ''
            } --protocol=tcp -D ${database} -e "SHOW CREATE TABLE ${entry}" -s -N`;
          const cmdRet = await run(createTableCommand, { MYSQL_PWD: password });
          const match = cmdRet.match(/ENGINE=FEDERATED\s+.*CONNECTION\s*=\s*'([^']+)\/.*?'/i);
          return match ? match[1] : '';
        });
        servers = await Promise.all(createTablePromises);
      }

      if (servers.filter(s => s).length === 0) return '';

      const fetchServerInfoCommand = `mysql -u ${username} -h ${host} ${port ? `-P ${port}` : ''
        } --protocol=tcp -D ${database} -e "
    SELECT Server_name, Host, Db, Username, Password, Port FROM mysql.servers
    WHERE Server_name IN ('${servers.filter(s => s).join("','")}');" -s -N`;
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

  async restore(filePath: string): Promise<void> {
    const { username, host, port, database, password } = this.dbOpts;

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

    const command = `${this.#restoreCmd} -u ${username} -h ${host} ${
      port ? `-P ${port}` : ''
    } --protocol=tcp ${database} < ${filePath}`;
    await run(command, { MYSQL_PWD: password });
  }
}

class PostgresAdapter extends BaseDBAdapter {
  get #backupCmd() {
    return formatPathInEnv(process.env.PG_DUMP_PATH) || 'pg_dump';
  }
  get #restoreCmd() {
    return formatPathInEnv(process.env.PG_RESTORE_PATH) || 'pg_restore';
  }
  async check(op: 'backup' | 'restore') {
    switch (op) {
      case 'backup':
        this.assertCommand(this.#backupCmd);
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
    } catch (_error) {}
  }

  async backup(dir: string): Promise<void> {
    const { username, host, port, database, password, schema: backupSchema } = this.dbOpts;
    const filePath = `${dir}/data`;
    const schemaOption = backupSchema ? `--schema=${backupSchema}` : '';
    // set the password in the environment variable, so we don't need to pass it in the command
    const command = `${this.#backupCmd} -U ${username} -h ${host} ${
      port ? `-p ${port}` : ''
    } -F c -b --quote-all-identifiers ${schemaOption} -f ${filePath} ${database}`;
    await run(command, { PGPASSWORD: password });
  }

  async restore(filePath: string, schema?: string): Promise<void> {
    const { username, host, port, database, password } = this.dbOpts;
    let schemaOption = this.dbOpts.schema;
    if (schema && !schemaOption) {
      schemaOption = 'public'; // if schema is provided, but schemaOption is not, set it to public
    }
    const cpuCores = os.cpus().length; // get the number of CPU cores, so we can use it to parallelize the restore
    const j = Math.max(1, Math.floor(cpuCores / 2)); // use half of the cores
    const schemaNameCondition = schemaOption
      ? `WHERE schemaname = '${schemaOption}'`
      : `WHERE schemaname NOT IN ('pg_catalog', 'information_schema')`;
    const relnamespaceCondition = schemaOption
      ? `WHERE relnamespace = '${schemaOption}'::regnamespace`
      : `WHERE tgrelid IN (SELECT oid FROM pg_class WHERE relnamespace NOT IN (SELECT oid FROM pg_catalog.pg_namespace WHERE nspname IN ('pg_catalog', 'information_schema')))`;
    const dropDataCommand = `psql -U ${username} -h ${host} ${port ? `-p ${port}` : ''} -d ${database} -c "
    DO ${D$$} DECLARE r RECORD; 
    BEGIN 
    FOR r IN (SELECT viewname,schemaname FROM pg_views ${schemaNameCondition}) LOOP
        BEGIN
          EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename) || ' CASCADE';
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
        EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename) || ' CASCADE';
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

    END ${D$$};"`.replace(/\n/g, ' ');

    // Run the command to drop all existing data
    await run(dropDataCommand, { PGPASSWORD: password });

    if (schema === schemaOption || !schemaOption) {
      // current schema is the same as the backup schema
      const pgRestoreCommand = `${this.#restoreCmd} -U ${username} -h ${host} ${
        port ? `-p ${port}` : ''
      } -d ${database} --clean --if-exists --no-owner -j ${j} ${filePath}`;
      await run(pgRestoreCommand, { PGPASSWORD: password });
    } else {
      const srcSchema = schema || 'public';
      const pgRestoreCommand = `${this.#restoreCmd} -U ${username} -h ${host} ${
        port ? `-p ${port}` : ''
      } -n ${srcSchema} -d ${database} --clean --if-exists --no-owner -j ${j} ${filePath}`;
      await this.#restoreSchema(srcSchema, schemaOption, pgRestoreCommand);
    }
  }

  async #restoreSchema(srcSchema: string, targetSchema: string, pgRestoreCommand: string) {
    const { username, host, port, database, password } = this.dbOpts;
    const ts = Date.now();
    // 1. backup current schema to srcSchema_ts if exists and create new schema (same name as srcSchema)
    const preCommand = `psql -U ${username} -h ${host} ${port ? `-p ${port}` : ''} -d ${database} -c "
    DO ${D$$}
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = '${srcSchema}') THEN
            EXECUTE 'ALTER SCHEMA ${srcSchema} RENAME TO ${srcSchema}_${ts}';
        END IF;
        EXECUTE 'CREATE SCHEMA ${srcSchema}';
    END ${D$$};"`.replace(/\n/g, ' ');
    const postCommand = `psql -U ${username} -h ${host} ${port ? `-p ${port}` : ''} -d ${database} -c "
    DO ${D$$}
    BEGIN
        EXECUTE 'DROP SCHEMA ${targetSchema} CASCADE';
        EXECUTE 'ALTER SCHEMA ${srcSchema} RENAME TO ${targetSchema}';
        IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = '${srcSchema}_${ts}') THEN
            EXECUTE 'ALTER SCHEMA ${srcSchema}_${ts} RENAME TO ${srcSchema}';
        END IF;
    END ${D$$};"`.replace(/\n/g, ' ');

    await run(preCommand, { PGPASSWORD: password });
    try {
      await run(pgRestoreCommand, { PGPASSWORD: password });
    } finally {
      await run(postCommand, { PGPASSWORD: password });
    }
    await this.#syncCollectionSchemaMetadata(srcSchema, targetSchema);
  }

  async #syncCollectionSchemaMetadata(srcSchema: string, targetSchema: string) {
    const { username, host, port, database, password, tablePrefix } = this.dbOpts;
    const collectionsTable = `${tablePrefix || ''}collections`;
    const targetSchemaLiteral = escapeStringLiteral(targetSchema);
    const srcSchemaLiteral = escapeStringLiteral(srcSchema);
    const collectionsTableLiteral = escapeStringLiteral(collectionsTable);
    const updateCollectionSchemaCommand = `psql -U ${username} -h ${host} ${port ? `-p ${port}` : ''} -d ${database} -c "
    DO ${D$$}
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
    END ${D$$};"`.replace(/\n/g, ' ');
    await run(updateCollectionSchemaCommand, { PGPASSWORD: password });
  }
}

class SQLiteAdapter extends BaseDBAdapter {
  async backup(dir: string): Promise<void> {
    const { storage } = this.dbOpts;
    const filePath = `${dir}/data`;
    const dbFilePath = path.resolve(storage);
    // const command = `cp ${storage} ${filePath}`; // not cross-platform, so we use node fs instead
    await fsPromises.copyFile(dbFilePath, filePath);
  }

  async restore(filePath: string): Promise<void> {
    const { storage } = this.dbOpts;
    const dbFilePath = path.resolve(storage);
    await fsPromises.copyFile(filePath, dbFilePath, fsPromises.constants.COPYFILE_FICLONE);
  }
}

class MariaDBAdapter extends MySQLAdapter {}

const adapterMap = {
  mysql: MySQLAdapter,
  postgres: PostgresAdapter,
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
