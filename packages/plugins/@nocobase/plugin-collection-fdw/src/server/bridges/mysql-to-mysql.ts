/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { Parser } from 'node-sql-parser';
import { CreateServerOptions, CreateTableOptions, RemoteLocalBridge } from './remote-local-bridge';
import lodash from 'lodash';

export class MySQLToMySQLBridge extends RemoteLocalBridge {
  async createServer(options: CreateServerOptions): Promise<void> {
    const { transaction } = options;
    //
    // skip if server already exists
    const servers = await this.localDatabase.sequelize.query(
      'SELECT * FROM mysql.servers WHERE `Server_name` = :serverName',
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
        CREATE SERVER '${options.serverName}'
FOREIGN DATA WRAPPER mysql
OPTIONS (USER :user, HOST :host, PORT ${options.port}, DATABASE :database, PASSWORD :password);
        `,
      {
        replacements: { ...options },
        transaction,
      },
    );
  }

  async createTable(options: CreateTableOptions): Promise<void> {
    const { remoteTableInfo, transaction, localModel, remoteServerName } = options;

    await this.localDatabase.sequelize.query(`DROP TABLE IF EXISTS ${localModel.tableName}`, {
      transaction,
    });

    let { remoteTableDefinition } = options;

    if (remoteTableDefinition) {
      remoteTableDefinition = this.replaceTableName(remoteTableDefinition, localModel.tableName);
    }

    const parser = new Parser();

    const ast = parser.astify(remoteTableDefinition, {
      database: 'MySQL',
    }) as any;

    ast.table_options = [
      { keyword: 'engine', symbol: '=', value: 'FEDERATED' },
      {
        keyword: 'default charset',
        symbol: '=',
        value: (() => {
          const existCharset = ast.table_options.find((tableOpt) => tableOpt.keyword === 'default charset');
          if (existCharset) {
            return existCharset.value;
          }

          return 'utf8mb4';
        })(),
      },
      {
        keyword: 'connection',
        symbol: '=',
        value: `'${remoteServerName}/${remoteTableInfo.tableName}'`,
      },
    ];

    ast.create_definitions = ast.create_definitions.map((def) => {
      return lodash.omit(def, ['collate', 'character_set']);
    });

    const sql = parser.sqlify(ast, {
      database: 'MySQL',
    });

    await this.localDatabase.sequelize.query(sql, {
      transaction,
    });
  }
}
