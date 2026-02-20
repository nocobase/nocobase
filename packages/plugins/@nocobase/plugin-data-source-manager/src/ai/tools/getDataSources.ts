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
    title: `{{t("ai.tools.getDataSources.title", { ns: "${pkg.name}" })}}`,
    about: `{{t("ai.tools.getDataSources.about", { ns: "${pkg.name}" })}}`,
  },
  definition: {
    name: 'getDataSources',
    description: 'Retrieve list of all available data sources',
    schema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
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
});
