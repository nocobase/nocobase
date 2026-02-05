/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { definedTools } from '@nocobase/ai';
import { ArgSchema, ArgType } from './common';
import { Context } from '@nocobase/actions';
import PluginAIServer from '../../../plugin';
import { buildPagedToolResult, normalizeLimitOffset, truncateLongStrings } from '../../../tools/utils';

export default definedTools({
  scope: 'GENERAL',
  defaultPermission: 'ALLOW',
  introduction: {
    title: '{{t("Data source query")}}',
    about: '{{t("Use dataSource, collectionName, and collection fields to query data from the database")}}',
  },
  definition: {
    name: 'dataSourceQuery',
    description: 'Use dataSource, collectionName, and collection fields to query data from the database',
    schema: ArgSchema,
  },
  invoke: async (ctx: Context, args: ArgType) => {
    const plugin = ctx.app.pm.get('ai') as PluginAIServer;

    // 限制单次查询数量
    const { limit, offset } = normalizeLimitOffset(args, { defaultLimit: 50, maxLimit: MAX_QUERY_LIMIT });

    const content = await plugin.aiContextDatasourceManager.query(ctx, {
      ...args,
      limit,
      offset,
    } as any);

    // 截断长字符串字段
    const records = truncateLongStrings(content?.records || []);
    const total = content?.total || 0;

    // 构造结果，包含分页提示供 LLM 理解
    const result: any = buildPagedToolResult({ total, offset, limit, records });

    if (result.hasMore) {
      result.note = `Showing ${result.returned} of ${result.total} records. To fetch more, call this tool again with offset:${result.nextOffset}`;
    }

    return {
      status: 'success',
      content: JSON.stringify(result),
    };
  },
});
