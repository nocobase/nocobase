/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { NoPermissionError } from '@nocobase/acl';
import { defineTools } from '@nocobase/ai';
import { applyQueryPermission, QueryPermissionQuery as DataQueryPermissionQuery } from '@nocobase/plugin-acl';
import {
  MAX_QUERY_LIMIT,
  getStructuredQueryArgError,
  normalizeLimitOffset,
  truncateLongStrings,
} from '../../../common/utils';
// @ts-ignore
import pkg from '../../../../../package.json';

const queryFieldSchema = {
  anyOf: [
    { type: 'string' },
    {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
    },
  ],
};

const queryMeasureSchema = {
  type: 'object',
  additionalProperties: true,
  required: ['field'],
  properties: {
    field: queryFieldSchema,
    type: {
      type: 'string',
      description: 'Optional field type hint.',
    },
    aggregation: {
      type: 'string',
      description: 'Aggregation function, such as count, sum, avg, max, or min.',
    },
    alias: {
      type: 'string',
      description: 'Output field alias.',
    },
    distinct: {
      type: 'boolean',
      description: 'Whether to apply distinct before aggregation.',
    },
  },
};

const queryDimensionSchema = {
  type: 'object',
  additionalProperties: true,
  required: ['field'],
  properties: {
    field: queryFieldSchema,
    type: {
      type: 'string',
      description: 'Optional field type hint.',
    },
    alias: {
      type: 'string',
      description: 'Output field alias.',
    },
    format: {
      type: 'string',
      description: 'Optional output format, usually for date and time dimensions.',
    },
    options: {
      type: 'object',
      description: 'Additional formatter options.',
      additionalProperties: true,
    },
  },
};

const queryOrderSchema = {
  type: 'object',
  additionalProperties: true,
  required: ['field'],
  properties: {
    field: queryFieldSchema,
    alias: {
      type: 'string',
      description: 'Alias to sort by when the selected field is projected with an alias.',
    },
    order: {
      type: 'string',
      enum: ['asc', 'desc'],
      description: 'Sort direction.',
    },
    nulls: {
      type: 'string',
      enum: ['default', 'first', 'last'],
      description: 'Null value ordering.',
    },
  },
};

const AggregateQuerySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['collectionName'],
  properties: {
    dataSource: {
      type: 'string',
      description: 'Data source key. Defaults to main.',
    },
    datasource: {
      type: 'string',
      description: 'Legacy alias of dataSource. Defaults to main.',
    },
    collectionName: {
      type: 'string',
      description: 'Collection name to query.',
    },
    measures: {
      type: 'array',
      description: 'Measure definitions for aggregate query.',
      items: queryMeasureSchema,
    },
    dimensions: {
      type: 'array',
      description: 'Dimension definitions for grouped query.',
      items: queryDimensionSchema,
    },
    orders: {
      type: 'array',
      description: 'Order definitions for aggregate query.',
      items: queryOrderSchema,
    },
    filter: {
      type: 'object',
      description:
        'Filter object applied before aggregation. Pass a structured object, not a JSON string. Follow the frontend NocoBase date filter contract: use only $dateOn, $dateNotOn, $dateBefore, $dateAfter, $dateNotBefore, $dateNotAfter, $dateBetween, $empty, and $notEmpty for calendar-style date filtering; prefer YYYY-MM-DD, YYYY-MM, YYYY, relative period objects, or ["start","end"] date ranges; do not expand month/day queries into UTC boundary timestamps.',
      additionalProperties: true,
    },
    having: {
      type: 'object',
      description:
        'Having object applied after grouping. Pass a structured object, not a JSON string. Reference selected measure aliases or selected field paths here, for example { count: { $gt: 10 } }.',
      additionalProperties: true,
    },
    offset: {
      type: 'number',
      description: 'Offset for query result rows.',
    },
    limit: {
      type: 'number',
      description: `Maximum number of rows to return. Defaults to 50 and is capped at ${MAX_QUERY_LIMIT}.`,
    },
  },
};

type AggregateQueryArgs = {
  dataSource?: string;
  datasource?: string;
  collectionName: string;
  measures?: DataQueryPermissionQuery['measures'];
  dimensions?: DataQueryPermissionQuery['dimensions'];
  orders?: DataQueryPermissionQuery['orders'];
  filter?: Record<string, any>;
  having?: Record<string, any>;
  offset?: number;
  limit?: number;
};

function getDataSourceKey(args: AggregateQueryArgs) {
  return args.dataSource || args.datasource || 'main';
}

function getTimezone(ctx: Context, args: AggregateQueryArgs) {
  const value =
    ctx.get?.('x-timezone') ||
    ctx.request?.get?.('x-timezone') ||
    ctx.request?.header?.['x-timezone'] ||
    ctx.req?.headers?.['x-timezone'];

  return Array.isArray(value) ? value[0] : value;
}

export default defineTools({
  scope: 'SPECIFIED',
  defaultPermission: 'ALLOW',
  introduction: {
    title: `{{t("ai.tools.dataQuery.title", { ns: "${pkg.name}" })}}`,
    about: `{{t("ai.tools.dataQuery.about", { ns: "${pkg.name}" })}}`,
  },
  definition: {
    name: 'dataQuery',
    description:
      'Run the repository query action on a collection with measures, dimensions, orders, filter, and having.',
    schema: AggregateQuerySchema,
  },
  invoke: async (ctx: Context, args: AggregateQueryArgs) => {
    const filterError = getStructuredQueryArgError('filter', args.filter);
    if (filterError) {
      return {
        status: 'error',
        content: filterError,
      };
    }

    const havingError = getStructuredQueryArgError('having', args.having);
    if (havingError) {
      return {
        status: 'error',
        content: havingError,
      };
    }

    const dataSourceKey = getDataSourceKey(args);
    const ds = ctx.app.dataSourceManager.get(dataSourceKey);

    if (!ds) {
      return {
        status: 'error',
        content: `Data source "${dataSourceKey}" not found`,
      };
    }

    const collection = ds.collectionManager.getCollection(args.collectionName);
    if (!collection) {
      return {
        status: 'error',
        content: `Collection "${args.collectionName}" not found in data source "${dataSourceKey}"`,
      };
    }

    const { limit, offset } = normalizeLimitOffset(args, { defaultLimit: 50, maxLimit: MAX_QUERY_LIMIT });
    const timezone = getTimezone(ctx, args);

    if (!args.measures?.length && !args.dimensions?.length) {
      return {
        status: 'error',
        content: 'Aggregate query requires at least one measure or dimension',
      };
    }

    try {
      const db = ds.collectionManager.db || ctx.db;
      const result = await applyQueryPermission({
        acl: ds.acl || ctx.app.acl,
        db,
        resourceName: args.collectionName,
        query: {
          measures: args.measures,
          dimensions: args.dimensions,
          orders: args.orders,
          filter: args.filter,
          having: args.having,
          limit,
          offset,
        },
        currentUser: ctx.state?.currentUser,
        currentRole: ctx.state?.currentRole,
        currentRoles: ctx.state?.currentRoles,
        timezone,
        state: ctx.state,
      });

      const queryResult = await db.getRepository(args.collectionName).query({
        ...result.query,
        context: ctx,
        timezone,
      });

      return {
        status: 'success',
        content: JSON.stringify(truncateLongStrings(queryResult)),
      };
    } catch (error: any) {
      if (error instanceof NoPermissionError) {
        return {
          status: 'error',
          content: 'No permissions',
        };
      }

      return {
        status: 'error',
        content: error?.message || 'Aggregate query failed',
      };
    }
  },
});
