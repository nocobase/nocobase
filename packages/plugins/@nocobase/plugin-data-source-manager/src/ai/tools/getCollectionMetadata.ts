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
// @ts-ignore
import pkg from '../../../package.json';

export default defineTools({
  scope: 'GENERAL',
  defaultPermission: 'ALLOW',
  introduction: {
    title: `{{t("ai.tools.getCollectionMetadata.title", { ns: "${pkg.name}" })}}`,
    about: `{{t("ai.tools.getCollectionMetadata.about", { ns: "${pkg.name}" })}}`,
  },
  definition: {
    name: 'getCollectionMetadata',
    description: 'Retrieve metadata for specified collections and their fields',
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
});
