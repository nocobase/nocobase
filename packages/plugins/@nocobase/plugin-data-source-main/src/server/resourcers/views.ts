/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, ViewFieldInference } from '@nocobase/database';

export default {
  name: 'dbViews',
  actions: {
    async get(ctx, next) {
      const { filterByTk, schema } = ctx.action.params;
      const db = ctx.app.db as Database;

      const fields = [];

      const unsupportedFields = [];

      const inferFields = await ViewFieldInference.inferFields({
        db,
        viewName: filterByTk,
        viewSchema: schema,
      });

      for (const [_name, field] of Object.entries(inferFields)) {
        if (!field.type) {
          unsupportedFields.push(field);
        } else {
          fields.push(field);
        }
      }

      ctx.body = {
        fields,
        unsupportedFields,
        sources: [
          ...new Set(
            Object.values(fields)
              .map((field) => field.source)
              .filter(Boolean)
              .map((source) => source.split('.')[0]),
          ),
        ],
      };

      await next();
    },

    list: async function (ctx, next) {
      const db = ctx.app.db as Database;
      const dbViews = await db.queryInterface.listViews({
        schema: db.options?.schema || process.env.DB_SCHEMA || process.env.COLLECTION_MANAGER_SCHEMA || 'public',
      });

      const viewCollections = Array.from(db.collections.values()).filter((collection) => collection.isView());

      ctx.body = dbViews
        .map((dbView) => {
          return {
            ...dbView,
          };
        })
        .filter((dbView) => {
          // if view is connected, skip
          return !viewCollections.find((collection) => {
            const viewName = dbView.name;
            const schema = dbView.schema;

            const collectionViewName = collection.options.viewName || collection.options.name;

            return collectionViewName === viewName && collection.options.schema === schema;
          });
        });

      await next();
    },

    async query(ctx, next) {
      const { filterByTk, fieldTypes, schema = 'public', page = 1, pageSize = 10 } = ctx.action.params;

      const offset = (page - 1) * pageSize;
      const limit = 1 * pageSize;

      const sql = `SELECT *
                   FROM ${ctx.app.db.utils.quoteTable(ctx.app.db.utils.addSchema(filterByTk, schema))} LIMIT ${limit}
                   OFFSET ${offset}`;

      const rawValues = await ctx.app.db.sequelize.query(sql, { type: 'SELECT' });

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
