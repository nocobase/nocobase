/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { z } from 'zod';
import { ToolOptions } from '../manager/tool-manager';
import { Context } from '@nocobase/actions';
import _ from 'lodash';

const idField = {
  name: 'id',
  type: 'bigInt',
  autoIncrement: true,
  primaryKey: true,
  allowNull: false,
  uiSchema: {
    type: 'number',
    title: '{{t("ID")}}',
    'x-component': 'InputNumber',
    'x-read-pretty': true,
  },
  interface: 'id',
};
const createdAtField = {
  name: 'createdAt',
  interface: 'createdAt',
  type: 'date',
  field: 'createdAt',
  uiSchema: {
    type: 'datetime',
    title: '{{t("Created at")}}',
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
    title: '{{t("Last updated at")}}',
    'x-component': 'DatePicker',
    'x-component-props': {},
    'x-read-pretty': true,
  },
};

const createPrompt = `You are now entering the **New Schema Creation Flow**. Follow these rules:

1. **Design Tables and Fields**
   - Define business entities and their attributes.

2. **Design Table Relationships**
   - Specify relationships: one-to-one, one-to-many, or many-to-many.

3. **Output and Confirmation**
   - Present the full schema in **formatted natural language** (not plain JSON).
   - Wait for user confirmation, then call the \`defineCollections\` tool with the **complete schema definition**.
   - Until the tool responds, **assume the schema is not saved** — user may continue editing.
   - **Do not say or imply the schema has been created without tool response.**

Only the \`defineCollections\` tool may be used.`;

const editPrompt = `## Existing Schema Editing Flow

1. **Clarify What Needs to Be Changed**
   - Identify which tables are affected by the requested changes.
   - If needed, call \`getCollectionNames\` to retrieve the list of all tables (ID and title).

2. **Fetch Table Metadata**
   - Analyze the current structure and identify what needs to be added, removed, or updated.
   - If needed, use the \`getCollectionMetadata\` tool to retrieve schema details of the target table(s).

3. **Propose Changes**
   - Output your change suggestions in clear **natural language**.
   - Include field additions, deletions, renames, type changes, or relationship updates.
   - Wait for user confirmation before applying any changes.

4. **Apply Changes**
   - Once confirmed, call the \`defineCollections\` tool with **only the modified parts** of the schema.
   - Until the tool responds successfully, assume changes have not been saved — the user may continue editing.
   - **Do not say or imply the schema is being or has been updated until a tool response is received.**`;

export const dataModelingIntentRouter: ToolOptions = {
  name: 'intentRouter',
  title: '{{t("Intent Router")}}',
  description: '{{t("Route intents to appropriate workflow")}}',
  schema: z.object({
    workflow: z.enum(['create', 'edit']),
  }),
  invoke: async (ctx: Context, args: { workflow: 'create' | 'edit' }) => {
    const { workflow } = args || {};
    if (workflow === 'create') {
      return {
        status: 'success',
        content: createPrompt,
      };
    }
    if (workflow === 'edit') {
      return {
        status: 'success',
        content: editPrompt,
      };
    }
    return {
      status: 'error',
      content: 'Please describe your requirement clearly.',
    };
  },
};

export const getCollectionNames: ToolOptions = {
  name: 'getCollectionNames',
  title: '{{t("Get collection names")}}',
  description: '{{t("Retrieve names and titles map of all collections")}}',
  schema: z.object({}),
  invoke: async (ctx: Context) => {
    let names: { name: string; title: string }[] = [];
    try {
      const collections = await ctx.db.getRepository('collections').find();
      names = collections.map((collection: { name: string; title: string }) => ({
        name: collection.name,
        title: collection.title,
      }));
    } catch (err) {
      ctx.log.error(err, {
        module: 'ai',
        subModule: 'toolCalling',
        groupName: 'dataModeling',
        toolName: 'getCollectionNames',
      });
      return {
        status: 'error',
        content: `Failed to retrieve collection names: ${err.message}`,
      };
    }

    return {
      status: 'success',
      content: JSON.stringify(names),
    };
  },
};

export const getCollectionMetadata: ToolOptions = {
  name: 'getCollectionMetadata',
  title: '{{t("Get collection metadata")}}',
  description: '{{t("Retrieve metadata for specified collections and their fields")}}',
  schema: z.object({
    collectionNames: z.array(z.string()).describe('An array of collection names to retrieve metadata for.'),
  }),
  invoke: async (
    ctx: Context,
    args: {
      collectionNames: string[];
    },
  ) => {
    const { collectionNames } = args || {};
    if (!collectionNames || !Array.isArray(collectionNames) || collectionNames.length === 0) {
      return {
        status: 'error',
        content: 'No collection names provided or invalid format.',
      };
    }
    const collections = await ctx.db.getRepository('collections').find({
      filter: { name: collectionNames },
      appends: ['fields'],
    });
    const metadata = collections.map((collection: any) => {
      const fields = collection.fields.map((field: any) => {
        return {
          name: field.name,
          type: field.type,
          interface: field.interface,
          options: field.options || {},
        };
      });
      return {
        name: collection.name,
        title: collection.title,
        fields,
      };
    });
    return {
      status: 'success',
      content: JSON.stringify(metadata),
    };
  },
};

export const defineCollections: ToolOptions = {
  name: 'defineCollections',
  title: '{{t("Define collections")}}',
  description: '{{t("Create or edit collections")}}',
  schema: z.object({
    collections: z.array(z.record(z.any())).describe('An array of collections to be defined or edited.'),
  }),
  invoke: async (ctx: Context) => {
    const {
      args: { collections },
    } = ctx.action.params.values || {};
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
            await repo.create({
              values: { ...options, fields: baseFields },
              transaction,
              context: ctx,
            });
          } else {
            await repo.update({
              filterByTk: options.name,
              values: _.omit(options, ['fields']),
              transaction,
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
                });
              } else {
                await fieldRepo.update({
                  filterByTk: field.name,
                  values: _.omit(field, ['key']),
                  transaction,
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
              });
            } else {
              await fieldRepo.update({
                filterByTk: field.name,
                values: _.omit(field, ['key']),
                transaction,
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
};
