/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { CreateServerOptions, CreateTableOptions, RemoteLocalBridge } from './remote-local-bridge';

export class PgToPgBridge extends RemoteLocalBridge {
  async createServer(options: CreateServerOptions): Promise<void> {
    const { transaction } = options;
    // skip if server already exists
    const servers = await this.localDatabase.sequelize.query(
      `SELECT * FROM pg_foreign_server WHERE srvname = :serverName`,
      {
        replacements: { serverName: options.serverName },
        transaction,
        type: 'SELECT',
      },
    );

    if (servers.length) {
      return;
    }

    await this.localDatabase.sequelize.query(
      `
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

CREATE SERVER IF NOT EXISTS "${options.serverName}"
FOREIGN DATA WRAPPER postgres_fdw
OPTIONS (host :host, port :port, dbname :database);

CREATE USER MAPPING IF NOT EXISTS FOR "${this.localDatabase.options.username}"
SERVER "${options.serverName}"
OPTIONS (user :user, password :password);
      `,
      {
        replacements: { ...options },
        transaction,
        type: 'RAW',
      },
    );
  }

  async createTable(options: CreateTableOptions): Promise<void> {
    const { remoteTableInfo, transaction, localModel, remoteServerName } = options;
    let { remoteTableDefinition } = options;

    // add trigger to set default id
    await this.remoteDatabase.sequelize.query(
      `
    CREATE OR REPLACE FUNCTION handle_null_id()
    RETURNS TRIGGER AS $$
    DECLARE
        sequence_name text;
        schema_name text;
        id_column_exists boolean;
    BEGIN
      SELECT INTO id_column_exists
        EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = (SELECT nspname FROM pg_namespace JOIN pg_class ON pg_class.relnamespace = pg_namespace.oid WHERE pg_class.oid = TG_RELID)
            AND table_name = (SELECT relname FROM pg_class WHERE oid = TG_RELID)
            AND column_name = 'id'
        );

        IF NOT id_column_exists THEN
          RETURN NEW;
        END IF;

        SELECT INTO schema_name nspname FROM pg_namespace
        JOIN pg_class ON pg_class.relnamespace = pg_namespace.oid
        WHERE pg_class.oid = TG_RELID;

        SELECT INTO sequence_name pg_get_serial_sequence(quote_ident(schema_name) || '.' || quote_ident(pg_class.relname), 'id')
        FROM pg_class WHERE pg_class.oid = TG_RELID;

        IF sequence_name IS NOT NULL AND NEW.id IS NULL THEN
          NEW.id := nextval(sequence_name);
        END IF;

        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;


    DROP TRIGGER IF EXISTS set_default_id ON "${remoteTableInfo.schema}"."${remoteTableInfo.tableName}";

    CREATE TRIGGER set_default_id
    BEFORE INSERT ON "${remoteTableInfo.schema}"."${remoteTableInfo.tableName}"
    FOR EACH ROW
    EXECUTE PROCEDURE handle_null_id();
        `,
      {
        type: 'RAW',
      },
    );

    await this.localDatabase.sequelize.query(
      `DROP FOREIGN TABLE IF EXISTS ${localModel.collection.quotedTableName()}`,
      {
        transaction,
      },
    );

    remoteTableDefinition = this.replaceTableName(remoteTableDefinition, localModel.collection.quotedTableName());
    remoteTableDefinition = remoteTableDefinition.replace('CREATE TABLE', 'CREATE FOREIGN TABLE');
    remoteTableDefinition = remoteTableDefinition.replace(';', '');
    remoteTableDefinition = remoteTableDefinition.replace(/\bNOT NULL\b/g, '');

    remoteTableDefinition = `${remoteTableDefinition} SERVER "${remoteServerName}" OPTIONS (schema_name '${remoteTableInfo.schema}', table_name '${remoteTableInfo.tableName}')`;

    await this.localDatabase.sequelize.query(remoteTableDefinition, {
      transaction,
    });
  }
}
