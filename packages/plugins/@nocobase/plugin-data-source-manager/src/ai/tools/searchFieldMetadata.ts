/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AIManager, defineTools } from '@nocobase/ai';
import { DataSource } from '@nocobase/data-source-manager';
import { Field } from '@nocobase/database';
// @ts-ignore
import pkg from '../../../package.json';

export default defineTools({
  scope: 'GENERAL',
  defaultPermission: 'ALLOW',
  introduction: {
    title: `{{t("ai.tools.searchFieldMetadata.title", { ns: "${pkg.name}" })}}`,
    about: `{{t("ai.tools.searchFieldMetadata.about", { ns: "${pkg.name}" })}}`,
  },
  definition: {
    name: 'searchFieldMetadata',
    description:
      'Search fields in data models by keyword (english first). Returns either search results or a suggested query.',
    schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search keywords, e.g. "order amount", "user email".',
        },
        dataSource: {
          type: 'string',
          description: 'Limit search to a specific data source.',
        },
        collection: {
          type: 'string',
          description: 'Limit search to a specific collection.',
        },
        fieldType: {
          type: 'string',
          description: 'Limit search to a specific field type, e.g. "string", "number".',
        },
        limit: {
          type: 'number',
          minimum: 1,
          maximum: 20,
          description: 'Maximum number of results to return. Default is 5.',
        },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
  invoke: async (
    ctx,
    args: {
      query: string;
      dataSource?: string;
      collection?: string;
      fieldType?: string;
      limit?: number;
    },
  ) => {
    const { query, dataSource: dataSourceArg, collection: collectionArg, fieldType, limit = 5 } = args || {};

    if (!query || typeof query !== 'string') {
      return {
        status: 'error',
        content: 'Search query is required.',
      };
    }

    try {
      const aiManager: AIManager = ctx.app.aiManager;
      const index = aiManager.documentManager.getIndex('dataModels.fields');

      if (!index) {
        return {
          status: 'error',
          content: 'Field search index is not available.',
        };
      }

      let isSuggest = false;
      let result = await index.search(query, {
        limit: Math.min(limit * 3, 20),
      });

      if (!result?.length) {
        result = await index.search(query, {
          suggest: true,
          limit: Math.min(limit * 3, 20),
        });
        isSuggest = true;
      }

      const results = (result || [])
        .map((path: string) => {
          const [ds, coll, f] = path.split('.');

          if (dataSourceArg && ds !== dataSourceArg) {
            return null;
          }
          if (collectionArg && coll !== collectionArg) {
            return null;
          }
          const dataSource: DataSource = ctx.app.dataSourceManager.get(ds);
          const collection = dataSource.collectionManager.getCollection(coll);
          const field = collection.getField(f) as Field;
          if (fieldType && field.type !== fieldType) {
            return null;
          }

          return {
            name: field.name,
            title: field.options?.uiSchema?.title || field.name,
            dataSource: ds,
            collection: coll,
            fieldType: field.type,
            options: field.options,
          };
        })
        .filter(Boolean)
        .slice(0, limit);

      return {
        status: 'success',
        content: JSON.stringify({
          kind: !isSuggest ? 'exact_results' : 'suggested_results',
          results,
        }),
      };
    } catch (err: any) {
      ctx.log.error(err, { module: 'ai-employees', submodule: 'tool-calling', method: 'searchFieldMetadata' });
      return {
        status: 'error',
        content: `Failed to search field metadata: ${err.message}`,
      };
    }
  },
});
