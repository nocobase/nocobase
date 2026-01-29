/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { ToolOptions } from '../manager/tool-manager';
import { Context } from '@nocobase/actions';
import _ from 'lodash';
import { z } from 'zod';

const idField = {
  name: 'id',
  type: 'snowflakeId',
  autoIncrement: false,
  primaryKey: true,
  allowNull: false,
  uiSchema: {
    type: 'number',
    title: '{{t("ID")}}',
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
   - Wait for user confirmation, then call the \`dataModeling-defineCollections\` tool with the **complete schema definition**.
   - Until the tool responds, **assume the schema is not saved** — user may continue editing.
   - **Do not say or imply the schema has been created without tool response.**

Only the \`dataModeling-defineCollections\` tool may be used.`;

const editPrompt = `## Existing Schema Editing Flow

1. **Clarify What Needs to Be Changed**
   - Identify which tables are affected by the requested changes.
   - If needed, call \`dataModeling-getCollectionNames\` to retrieve the list of all tables (ID and title).

2. **Fetch Table Metadata**
   - Analyze the current structure and identify what needs to be added, removed, or updated.
   - If needed, use the \`dataModeling-getCollectionMetadata\` tool to retrieve schema details of the target table(s).

3. **Propose Changes**
   - Output your change suggestions in clear **natural language**.
   - Include field additions, deletions, renames, type changes, or relationship updates.
   - Wait for user confirmation before applying any changes.

4. **Apply Changes**
   - Once confirmed, call the \`dataModeling-defineCollections\` tool with **only the modified parts** of the schema.
   - Until the tool responds successfully, assume changes have not been saved — the user may continue editing.
   - **Do not say or imply the schema is being or has been updated until a tool response is received.**`;

class IntentError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export const dataModelingIntentRouter: ToolOptions = {
  name: 'intentRouter',
  title: '{{t("Intent Router")}}',
  description: '{{t("Route intents to appropriate workflow")}}',
  schema: {
    type: 'object',
    properties: {
      workflow: {
        type: 'string',
        enum: ['create', 'edit'],
      },
    },
    required: ['workflow'],
  },
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
  schema: {
    type: 'object',
    properties: {
      dataSource: {
        type: 'string',
        description: 'The data source name to retrieve collections from. Defaults to "main".',
      },
    },
    additionalProperties: false,
  },
  invoke: async (ctx: Context, args: { dataSource?: string }) => {
    const { dataSource = 'main' } = args || {};
    let names: { name: string; title: string }[] = [];
    try {
      const ds = ctx.app.dataSourceManager.dataSources.get(dataSource);
      if (!ds) {
        throw new Error(`Data source "${dataSource}" not found`);
      }

      const collections = ds.collectionManager.getCollections();
      names = collections.map((collection) => ({
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
  schema: {
    type: 'object',
    properties: {
      dataSource: {
        type: 'string',
        description: 'The data source name. Defaults to "main".',
      },
      collectionNames: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'An array of collection names to retrieve metadata for.',
      },
    },
    required: ['collectionNames'],
    additionalProperties: false,
  },
  invoke: async (
    ctx: Context,
    args: {
      dataSource?: string;
      collectionNames: string[];
    },
  ) => {
    const { collectionNames, dataSource = 'main' } = args || {};
    if (!collectionNames || !Array.isArray(collectionNames) || collectionNames.length === 0) {
      return {
        status: 'error',
        content: 'No collection names provided or invalid format.',
      };
    }

    try {
      const ds = ctx.app.dataSourceManager.dataSources.get(dataSource);
      if (!ds) {
        return {
          status: 'error',
          content: `Data source "${dataSource}" not found`,
        };
      }

      const metadata = [];
      for (const name of collectionNames) {
        const collection = ds.collectionManager.getCollection(name);
        if (!collection) continue;

        const fields = collection.getFields().map((field) => {
          return {
            name: field.name,
            type: field.type,
            interface: field.options.interface,
            options: field.options || {},
          };
        });
        metadata.push({
          name: collection.name,
          title: collection.title,
          fields,
        });
      }
      return {
        status: 'success',
        content: JSON.stringify(metadata),
      };
    } catch (err) {
      return {
        status: 'error',
        content: `Failed to retrieve metadata: ${err.message}`,
      };
    }
  },
};

export const getDataSources: ToolOptions = {
  name: 'getDataSources',
  title: '{{t("Get data sources")}}',
  description: '{{t("Retrieve list of all available data sources")}}',
  schema: {
    type: 'object',
    properties: {},
    additionalProperties: false,
  },
  invoke: async (ctx: Context) => {
    try {
      const records = await ctx.db.getRepository('dataSources').find();
      const displayNameMap = new Map(records.map((r) => [r.get('key'), r.get('displayName')]));
      const dataSources = [];
      // Add data sources
      for (const [key, ds] of ctx.app.dataSourceManager.dataSources) {
        dataSources.push({
          key: key,
          displayName: displayNameMap.get(key) || key,
          type: ds.collectionManager?.db?.sequelize?.getDialect() || 'unknown',
        });
      }

      return {
        status: 'success',
        content: JSON.stringify(dataSources),
      };
    } catch (err) {
      return {
        status: 'error',
        content: `Failed to retrieve data sources: ${err.message}`,
      };
    }
  },
};

export const defineCollections: ToolOptions = {
  name: 'defineCollections',
  title: '{{t("Define collections")}}',
  description: '{{t("Create or edit collections")}}',
  schema: z.object({
    intent: z.enum(['create', 'edit']).describe(
      `Pass the intent of the current tool invocation as an enum value. The value must be either 'create' or 'edit':
- create: create a brand-new data table definition
- edit: modify an existing data table definition`,
    ),
    collections: z
      .array(
        z.object({}).catchall(z.any()).describe('Valid collection object which defined in collection_type_definition'),
      )
      .describe('An array of collections to be defined or edited.'),
  }),
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
};
