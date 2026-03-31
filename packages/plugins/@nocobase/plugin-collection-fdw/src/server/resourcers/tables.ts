/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { ViewFieldInference } from '@nocobase/database';
import lodash from 'lodash';
import { DatabaseServerModel } from '../models/database-server';

async function getServerInstanceFromRequest(ctx) {
  const { resourceOf } = ctx.action;

  const serverInstance = (await ctx.db.getRepository('databaseServers').findOne({
    filterByTk: resourceOf,
  })) as DatabaseServerModel;

  if (!serverInstance) {
    throw new Error(`server ${resourceOf} not found`);
  }

  serverInstance.setApp(ctx.app);

  return serverInstance;
}

async function splitNameToNameWithSchema(tableNameString: string) {
  if (!tableNameString.includes('.')) {
    return {
      tableName: tableNameString,
    };
  }

  const [schema, tableName] = tableNameString.split('.');
  return {
    schema,
    tableName,
  };
}

function guessTableSequelizeAttribute(fields: any) {
  return {};
}

function columnAttribute(columnsInfo, columnName, indexes) {
  const columnInfo = columnsInfo[columnName];

  const attr: any = {
    type: columnInfo.type,
    allowNull: columnInfo.allowNull,
    primaryKey: columnInfo.primaryKey,
    unique: false,
  };

  if (columnInfo.defaultValue && typeof columnInfo.defaultValue === 'string') {
    const isSerial = columnInfo.defaultValue.match(/^nextval\(/);
    const isUUID = columnInfo.defaultValue.match(/^uuid_generate_v4\(/);

    if (!isSerial && !isUUID) {
      attr.defaultValue = columnInfo.defaultValue;
    }
  }

  for (const index of indexes) {
    if (index.fields.length == 1 && index.fields[0].attribute == columnName && index.unique) {
      attr.unique = true;
    }
  }

  if (attr.primaryKey && columnName == 'id') {
    attr.autoIncrement = true;
  }

  return attr;
}

export default {
  name: 'databaseServers.tables',
  actions: {
    // list tables on remote server
    async list(ctx, next) {
      const serverInstance = await getServerInstanceFromRequest(ctx);
      serverInstance.setApp(ctx.app);
      ctx.body = await serverInstance.listRemoteTables();
      await next();
    },

    // get remote table columns
    async get(ctx, next) {
      const serverInstance = await getServerInstanceFromRequest(ctx);
      serverInstance.setApp(ctx.app);
      const tableName = ctx.action.params.filterByTk;
      const tableInfo = await splitNameToNameWithSchema(tableName);

      // remote table description
      const tableColumns = await serverInstance.describeTable(tableInfo);
      const indexes = await serverInstance.showIndexes(tableInfo);

      const unsupportedFields = [];
      const fields = [];

      lodash.forEach(tableColumns, (column, key) => {
        const columnInfo = {
          ...columnAttribute(tableColumns, key, indexes),
          ...ViewFieldInference.inferToFieldType({
            dialect: serverInstance.get('dialect'),
            type: column.type,
            name: key,
          }),
          name: key,
          rawType: tableColumns[key].type,
        };

        if (columnInfo.type) {
          fields.push(columnInfo);
        } else {
          unsupportedFields.push(columnInfo);
        }
      });

      const tableOptions: any = {
        fields,
        unsupportedFields,
      };

      tableOptions.options = guessTableSequelizeAttribute(tableOptions.fields);

      ctx.body = tableOptions;

      await next();
    },

    async query(ctx, next) {
      const { filterByTk, fieldTypes, schema = 'public', page = 1, pageSize = 10 } = ctx.action.params;

      const serverInstance = await getServerInstanceFromRequest(ctx);
      serverInstance.setApp(ctx.app);

      const tableInfo = await splitNameToNameWithSchema(filterByTk);

      const offset = (page - 1) * pageSize;
      const limit = 1 * pageSize;

      const sql = `SELECT *
                   FROM ${ctx.app.db.utils.quoteTable(
                     ctx.app.db.utils.addSchema(tableInfo['tableName'], tableInfo['schema']),
                   )} LIMIT ${limit}
                   OFFSET ${offset}`;

      const remoteDB = serverInstance.getRemoteDatabaseInstance();
      const rawValues = await remoteDB.sequelize.query(sql, { type: 'SELECT' });

      await remoteDB.close();

      if (fieldTypes) {
        for (const raw of rawValues) {
          const fakeInstance = {
            dataValues: raw,
            getDataValue: (key) => raw[key],
          };

          for (const fieldName of Object.keys(fieldTypes)) {
            const fieldType = fieldTypes[fieldName];
            const FieldClass = ctx.app.db.fieldTypes.get(fieldType);

            const fieldOptions = new FieldClass(
              { name: fieldName },
              {
                db: ctx.app.db,
              },
            ).options;

            if (fieldOptions.get) {
              const newValue = fieldOptions.get.apply(fakeInstance);
              raw[fieldName] = newValue;
            }
          }
        }
      }

      ctx.body = rawValues;
      await next();
    },
  },
};
