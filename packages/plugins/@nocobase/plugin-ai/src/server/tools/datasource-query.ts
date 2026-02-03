/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { z } from 'zod';
import PluginAIServer from '../plugin';
import { truncateLongStrings, MAX_QUERY_LIMIT, normalizeLimitOffset, buildPagedToolResult } from './utils';
import { ToolsOptions } from '@nocobase/ai';

const ArgSchema = z.object({
  datasource: z.string().describe('{{t("Data source key")}}'),
  collectionName: z.string().describe('{{t("Collection name")}}'),
  fields: z.array(z.string()).describe('{{t("Fields to be queried")}}'),
  appends: z.array(z.string()).describe('{{t("Related collection to be queried")}}'),
  filter: z.object({}).catchall(z.any()).describe(`# Parameters definition
\`\`\`
export type QueryCondition = {
  [field: string]: { // \`field\` key is Field name
    [operator: string]: any; // \`operator\` key is Query condition operator.
  };
};


export type QueryObject =
  | {
      [logic: string]: (QueryCondition | QueryObject)[]; // \`logic\` key is the relationship between query conditions, should be one of '$and', '$or', the value is recursion object array, item in array can be QueryCondition or QueryObject
    }
  | QueryCondition // QueryCondition definition above;
\`\`\`


// QueryCondition examples

\`\`\`
const example1: QueryCondition = {
  age: { $gt: 18 },          // age great than 18
  name: { $like: '%John%' }, // name include John
};

const example2: QueryCondition = {
  status: { $in: ['active', 'pending'] }, // status is active or pending
};
\`\`\`

// QueryObject example
\`\`\`
const example1: QueryObject = {
  $and: [
    { age: { $gt: 18 } },
    { status: { $eq: 'active' } }
  ]
};

const example2: QueryObject = {
  $or: [
    { name: { $like: '%John%' } },
    {
      $and: [
        { age: { $gte: 30 } },
        { status: { $eq: 'pending' } }
      ]
    }
  ]
};

const example3: QueryObject = { age: { $lt: 50 } };
\`\`\`
`),
  sort: z
    .array(z.string())
    .describe(
      '{{t("Sort field names. By default, they are in ascending order. A minus sign before the field name indicates descending order")}}',
    ),
  offset: z.number().optional().describe('{{t("Offset of records to be queried")}}'),
  limit: z.number().optional().describe('{{t("Maximum number of records to be queried")}}'),
});

type ArgType = z.infer<typeof ArgSchema>;

export const dataSourceQuery: ToolsOptions = {
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
};

export const dataSourceCounting: ToolsOptions = {
  scope: 'GENERAL',
  defaultPermission: 'ALLOW',
  introduction: {
    title: '{{t("Data source records counting")}}',
    about:
      '{{t("Use dataSource, collectionName, and collection fields to query data from the database, get total count of records")}}',
  },
  definition: {
    name: 'dataSourceCounting',
    description:
      'Use dataSource, collectionName, and collection fields to query data from the database, get total count of records',
    schema: ArgSchema,
  },
  invoke: async (ctx: Context, args: ArgType) => {
    const plugin = ctx.app.pm.get('ai') as PluginAIServer;
    const content = await plugin.aiContextDatasourceManager.query(ctx, { ...args, offset: 0, limit: 1 } as any);
    return {
      status: 'success',
      content: String(content?.total ?? 0),
    };
  },
};
