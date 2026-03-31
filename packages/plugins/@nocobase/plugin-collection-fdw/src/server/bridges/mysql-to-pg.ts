/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

// export class MySQLToPgBridge extends RemoteLocalBridge {
//   async createServer(options: CreateServerOptions): Promise<void> {
//     const { transaction } = options;
//
//     await this.localDatabase.sequelize.query(
//       `
//         CREATE EXTENSION IF NOT EXISTS mysql_fdw;
//         CREATE SERVER IF NOT EXISTS ${options.serverName}
// FOREIGN DATA WRAPPER mysql_fdw
// OPTIONS (host :host, port :port);
//
// CREATE USER MAPPING IF NOT EXISTS FOR ${this.localDatabase.options.username}
// SERVER ${options.serverName}
// OPTIONS (user :user, password :password);
//       `,
//       {
//         replacements: { ...options },
//         transaction,
//         type: 'RAW',
//       },
//     );
//   }
// }
