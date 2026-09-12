/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineTools } from '@nocobase/ai';
import { ArgSchema, ArgType } from '../../../common/common';
import { Context } from '@nocobase/actions';
import { getStructuredQueryArgError } from '../../../common/utils';
// @ts-ignore
import pkg from '../../../../../package.json';

export default defineTools({
  scope: 'SPECIFIED',
  defaultPermission: 'ALLOW',
  introduction: {
    title: `{{t("ai.tools.dataSourceCounting.title", { ns: "${pkg.name}" })}}`,
    about: `{{t("ai.tools.dataSourceCounting.about", { ns: "${pkg.name}" })}}`,
  },
  definition: {
    name: 'dataSourceCounting',
    description:
      'Use dataSource, collectionName, and collection fields to query data from the database, get total count of records. The filter argument must be a structured object, not a JSON string.',
    schema: ArgSchema,
  },
  invoke: async (ctx: Context, args: ArgType) => {
    const filterError = getStructuredQueryArgError('filter', args.filter);
    if (filterError) {
      return {
        status: 'error',
        content: filterError,
      };
    }

    const plugin = ctx.app.pm.get('ai');
    const content = await plugin.aiContextDatasourceManager.query(ctx, { ...args, offset: 0, limit: 1 } as any);
    return {
      status: 'success',
      content: String(content?.total ?? 0),
    };
  },
});
