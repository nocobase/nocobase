/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import { describe, expect, it } from 'vitest';
import { McpToolsManager } from '@nocobase/ai';
import { createCrudTools } from '../crud-tool';

function createTestApp() {
  const app = new Koa();
  app.use(bodyParser());
  app.use(async (ctx) => {
    ctx.body = {
      method: ctx.method,
      path: ctx.path,
      query: ctx.query,
      querystring: ctx.querystring,
      headers: {
        dataSource: ctx.get('x-data-source'),
        timezone: ctx.get('x-timezone'),
      },
      body: ctx.request.body,
    };
  });

  return {
    callback: () => app.callback(),
    resourcer: {
      options: {
        prefix: '/api',
      },
    },
  };
}

describe('createCrudTools', () => {
  it('should create separate single-action tools', () => {
    const tools = createCrudTools({
      app: createTestApp(),
      mcpToolsManager: new McpToolsManager(),
    });

    expect(tools.map((tool) => tool.name)).toEqual([
      'resource_list',
      'resource_get',
      'resource_create',
      'resource_update',
      'resource_destroy',
      'resource_query',
    ]);
  });

  it('should post-process list results', async () => {
    const manager = new McpToolsManager();
    manager.registerToolResultPostProcessor('dataSources', 'list', (result) => {
      return {
        data: result.data.map((item) => ({
          key: item.key,
          displayName: item.displayName,
        })),
      };
    });

    const tools = createCrudTools({
      app: {
        callback: () => (req, res) => {
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.end(
            JSON.stringify({
              data: [
                {
                  key: 'main',
                  displayName: 'Main',
                  status: 'loaded',
                },
              ],
            }),
          );
        },
        resourcer: { options: { prefix: '/api' } },
      },
      mcpToolsManager: manager,
    });

    const tool = tools.find((item) => item.name === 'resource_list')!;
    const result = await tool.call(
      {
        resource: 'dataSources',
      },
      {
        headers: {},
      },
    );

    expect(result).toEqual({
      data: [
        {
          key: 'main',
          displayName: 'Main',
        },
      ],
    });
  });

  it('should send query payload without route-only params and forward timezone header', async () => {
    const tools = createCrudTools({
      app: createTestApp(),
      mcpToolsManager: new McpToolsManager(),
    });

    const queryTool = tools.find((tool) => tool.name === 'resource_query')!;
    const result = await queryTool.call({
      dataSource: 'analytics',
      resource: 'posts',
      measures: [{ field: ['id'], aggregation: 'count', alias: 'count' }],
      dimensions: [{ field: ['status'], alias: 'status' }],
      having: { count: { $gt: 1 } },
      limit: 10,
      timezone: 'Asia/Shanghai',
    });

    expect(result).toMatchObject({
      method: 'POST',
      path: '/api/posts:query',
      query: {},
      headers: {
        dataSource: 'analytics',
        timezone: 'Asia/Shanghai',
      },
      body: {
        measures: [{ field: ['id'], aggregation: 'count', alias: 'count' }],
        dimensions: [{ field: ['status'], alias: 'status' }],
        having: { count: { $gt: 1 } },
        limit: 10,
      },
    });
    expect(result.body.resource).toBeUndefined();
    expect(result.body.dataSource).toBeUndefined();
    expect(result.body.timezone).toBeUndefined();
  });

  it('should support association resource list with sourceId', async () => {
    const tools = createCrudTools({
      app: createTestApp(),
      mcpToolsManager: new McpToolsManager(),
    });

    const listTool = tools.find((tool) => tool.name === 'resource_list')!;
    const result = await listTool.call({
      resource: 'posts.comments',
      sourceId: 1,
      fields: ['id', 'content'],
    });

    expect(result).toMatchObject({
      method: 'POST',
      path: '/api/posts/1/comments:list',
      query: {
        fields: ['id', 'content'],
      },
    });
  });

  it('should expose detailed query item schemas', () => {
    const tools = createCrudTools({
      app: createTestApp(),
      mcpToolsManager: new McpToolsManager(),
    });

    const queryTool = tools.find((tool) => tool.name === 'resource_query')!;
    const measureItemSchema = queryTool.inputSchema.properties.measures.items;
    const dimensionItemSchema = queryTool.inputSchema.properties.dimensions.items;
    const orderItemSchema = queryTool.inputSchema.properties.orders.items;

    expect(measureItemSchema.required).toEqual(['field']);
    expect(measureItemSchema.properties.aggregation).toBeDefined();
    expect(measureItemSchema.properties.distinct).toBeDefined();

    expect(dimensionItemSchema.required).toEqual(['field']);
    expect(dimensionItemSchema.properties.format).toBeDefined();
    expect(dimensionItemSchema.properties.options).toBeDefined();

    expect(orderItemSchema.required).toEqual(['field']);
    expect(orderItemSchema.properties.order.enum).toEqual(['asc', 'desc']);
    expect(orderItemSchema.properties.nulls.enum).toEqual(['default', 'first', 'last']);
  });
});
