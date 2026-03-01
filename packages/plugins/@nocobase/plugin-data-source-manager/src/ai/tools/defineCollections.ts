/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { defineTools } from '@nocobase/ai';
import _ from 'lodash';
import { z } from 'zod';
// @ts-ignore
import pkg from '../../../package.json';

const idField = {
  name: 'id',
  type: 'snowflakeId',
  autoIncrement: false,
  primaryKey: true,
  allowNull: false,
  uiSchema: {
    type: 'number',
    title: `{{t("ai.tools.defineCollections.fields.id", { ns: "${pkg.name}" })}}`,
    'x-component': 'InputNumber',
    'x-component-props': {
      stringMode: true,
      separator: '0.00',
      step: '1',
    },
    'x-validator': 'integer',
  },
  interface: 'snowflakeId',
};
const createdAtField = {
  name: 'createdAt',
  interface: 'createdAt',
  type: 'date',
  field: 'createdAt',
  uiSchema: {
    type: 'datetime',
    title: `{{t("ai.tools.defineCollections.fields.createdAt", { ns: "${pkg.name}" })}}`,
    'x-component': 'DatePicker',
    'x-component-props': {},
    'x-read-pretty': true,
  },
};
const updatedAtField = {
  type: 'date',
  field: 'updatedAt',
  name: 'updatedAt',
  interface: 'updatedAt',
  uiSchema: {
    type: 'datetime',
    title: `{{t("ai.tools.defineCollections.fields.updatedAt", { ns: "${pkg.name}" })}}`,
    'x-component': 'DatePicker',
    'x-component-props': {},
    'x-read-pretty': true,
  },
};

class IntentError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export default defineTools({
  scope: 'SPECIFIED',
  introduction: {
    title: `{{t("ai.tools.defineCollections.title", { ns: "${pkg.name}" })}}`,
    about: `{{t("ai.tools.defineCollections.about", { ns: "${pkg.name}" })}}`,
  },
  definition: {
    name: 'defineCollections',
    description: 'Create or edit collections',
    schema: z.object({
      intent: z.enum(['create', 'edit']).describe(
        `Pass the intent of the current tool invocation as an enum value. The value must be either 'create' or 'edit':
- create: create a brand-new data table definition
- edit: modify an existing data table definition`,
      ),
      collections: z
        .array(
          z
            .object({})
            .catchall(z.any())
            .describe('Valid collection object which defined in collection_type_definition'),
        )
        .describe('An array of collections to be defined or edited.'),
    }),
  },
  invoke: async (ctx: Context, args: any) => {
    const toolCallArgs = ctx.action?.params?.values?.args?.intent ? ctx.action?.params?.values?.args : args;
    const { intent, collections: originalCollections } = toolCallArgs ?? {};
    if (!intent || !['create', 'edit'].includes(intent)) {
      return {
        status: 'error',
        content: `Please explicitly specify your intent. The value of the intent parameter must be either 'create' or 'edit'.`,
      };
    }
    const collectionsType = typeof originalCollections;
    const collections = collectionsType === 'string' ? JSON.parse(originalCollections) : originalCollections;
    if (!collections || !Array.isArray(collections)) {
      return {
        status: 'error',
        content: 'No collections provided or invalid format.',
      };
    }
    const sorted = collections.sort((a, b) => (a.isThrough ? 1 : 0) - (b.isThrough ? 1 : 0));
    try {
      await ctx.db.sequelize.transaction(async (transaction) => {
        const repo = ctx.db.getRepository('collections');
        const pendingRelationFields: {
          name: string;
          relationFields: any[];
        }[] = [];

        for (const rawOptions of sorted) {
          const options = { ...rawOptions };
          options.fields = options.fields || [];

          // Remove CURRENT_TIMESTAMP defaultValue
          options.fields = options.fields.map((f: any) =>
            f.defaultValue === 'CURRENT_TIMESTAMP' ? _.omit(f, ['defaultValue']) : f,
          );

          // Filter fields
          const relationFields = options.fields.filter((f: any) =>
            ['belongsTo', 'hasMany', 'belongsToMany', 'hasOne'].includes(f.type),
          );
          const normalFields = options.fields.filter(
            (f: any) => !['belongsTo', 'hasMany', 'belongsToMany', 'hasOne'].includes(f.type),
          );

          // System fields
          const systemFields = [];
          if (options.autoGenId !== false && !options.isThrough) {
            systemFields.push(idField);
            options.autoGenId = false;
          }
          if (options.createdAt !== false) {
            systemFields.push(createdAtField);
            options.createdAt = true;
          }
          if (options.updatedAt !== false) {
            systemFields.push(updatedAtField);
            options.updatedAt = true;
          }

          const baseFields = [...systemFields, ...normalFields];
          const collection = await repo.findOne({ filter: { name: options.name }, transaction });
          if (!collection) {
            if (intent === 'edit') {
              throw new IntentError(
                `You want to edit a collection definition, but there is no existing data table definition named '${options.name}'.`,
              );
            }
            await repo.create({
              values: { ...options, fields: baseFields },
              transaction,
              context: ctx,
            });
          } else {
            if (intent === 'create') {
              throw new IntentError(
                `You want to create a collection definition, but a collection definition named '${options.name}' already exists. Please change the name of your collection definition and then invoke this tool again.`,
              );
            }
            await repo.update({
              filterByTk: options.name,
              values: _.omit(options, ['fields']),
              transaction,
              context: ctx,
            });
            for (const field of baseFields) {
              const fieldRepo = ctx.db.getRepository('collections.fields', options.name);
              const existing = await fieldRepo.findOne({
                filter: {
                  name: field.name,
                },
              });
              if (!existing) {
                await fieldRepo.create({
                  values: field,
                  transaction,
                  context: ctx,
                });
              } else {
                await fieldRepo.update({
                  filterByTk: field.name,
                  values: _.omit(field, ['key']),
                  transaction,
                  context: ctx,
                });
              }
            }
          }

          if (relationFields.length > 0) {
            pendingRelationFields.push({
              name: options.name,
              relationFields,
            });
          }
        }
        for (const { name, relationFields } of pendingRelationFields) {
          const fieldRepo = ctx.db.getRepository('collections.fields', name);
          for (const field of relationFields) {
            const existing = await fieldRepo.findOne({
              filter: {
                name: field.name,
              },
            });
            if (!existing) {
              await fieldRepo.create({
                values: field,
                transaction,
                context: ctx,
              });
            } else {
              await fieldRepo.update({
                filterByTk: field.name,
                values: _.omit(field, ['key']),
                transaction,
                context: ctx,
              });
            }
          }
        }
      });
    } catch (e) {
      ctx.log.error(e, {
        module: 'ai',
        subModule: 'toolCalling',
        groupName: 'dataModeling',
        toolName: 'defineCollections',
        collections,
        stack: e.stack,
        cause: e.cause,
      });
      if (e instanceof IntentError) {
        return {
          status: 'error',
          content: e.message,
        };
      }
      if (intent === 'create') {
        for (const options of sorted) {
          ctx.db.removeCollection(options.name);
        }
      }
      return {
        status: 'error',
        content: `Failed to define collections: ${e.message}`,
      };
    }

    return {
      status: 'success',
      content: 'Defined collections successfully in one transaction.',
    };
  },
});
