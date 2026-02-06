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
    title: `{{t("ai.tools.getCollectionNames.title", { ns: "${pkg.name}" })}}`,
    about: `{{t("ai.tools.getCollectionNames.about", { ns: "${pkg.name}" })}}`,
  },
  definition: {
    name: 'getCollectionNames',
    description: 'Retrieve names and titles map of all collections',
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
});
