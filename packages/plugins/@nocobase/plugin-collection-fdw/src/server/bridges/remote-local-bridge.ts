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

import { Database, Model } from '@nocobase/database';
import { Transactionable } from 'sequelize';

type RemoteDialect = 'postgres' | 'mysql' | 'mariadb';

export type TableInfo = {
  schema?: string;
  tableName: string;
};

export type CreateServerOptions = {
  serverName: string;
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
} & Transactionable;

export type CreateTableOptions = {
  remoteServerName: string;
  remoteTableDefinition: string;
  remoteTableInfo: TableInfo;
  localModel: typeof Model;
} & Transactionable;

const IDENTIFIER_REGEX = String.raw`(?:[\`"'](?:(?![\`"']).)+[\`"']|[a-zA-Z0-9_-]+)`;
// Matches `CREATE TABLE` followed by one or more schema/table identifiers separated by dots
export const REPLACE_TABLE_NAME_REGEX = new RegExp(
  String.raw`CREATE TABLE\s+((?:${IDENTIFIER_REGEX})(?:\.(?:${IDENTIFIER_REGEX}))*)`,
);

export abstract class RemoteLocalBridge {
  protected localDatabase: Database;
  protected remoteDatabase: Database;

  constructor(localDatabase: Database, remoteDatabase: Database) {
    this.localDatabase = localDatabase;
    this.remoteDatabase = remoteDatabase;
  }

  abstract createServer(options: CreateServerOptions): Promise<void>;
  abstract createTable(options: CreateTableOptions): Promise<void>;

  protected replaceTableName(sql: string, tableName: string) {
    return sql.replace(REPLACE_TABLE_NAME_REGEX, `CREATE TABLE ${tableName}`);
  }
}

interface CreateBridgeOptions {
  remoteDatabase: Database;
  localDatabase: Database;
}

export class RemoteLocalBridgeFactory {
  static bridges: Map<string, typeof RemoteLocalBridge> = new Map();

  static getKeyOfTuple(remoteDialect: RemoteDialect, localDialect: RemoteDialect) {
    return `${remoteDialect}-${localDialect}`;
  }

  static createBridge(options: CreateBridgeOptions): RemoteLocalBridge {
    const { remoteDatabase, localDatabase } = options;
    const remoteDialect = remoteDatabase.options.dialect as RemoteDialect;
    const localDialect = localDatabase.options.dialect as RemoteDialect;

    const bridge = this.bridges.get(this.getKeyOfTuple(remoteDialect, localDialect));

    if (!bridge) {
      throw new Error(`bridge not found for ${remoteDialect} to ${localDialect}`);
    }

    // @ts-ignore
    return new bridge(localDatabase, remoteDatabase);
  }

  static registerBridge(remoteDialect: RemoteDialect, localDialect: RemoteDialect, bridge: typeof RemoteLocalBridge) {
    this.bridges.set(this.getKeyOfTuple(remoteDialect, localDialect), bridge);
  }
}
