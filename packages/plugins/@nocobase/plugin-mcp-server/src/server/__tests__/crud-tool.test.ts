/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { McpToolsManager } from '@nocobase/ai';
import { createCrudTool } from '../crud-tool';

describe('createCrudTool', () => {
  it('should post-process CRUD list results', async () => {
    const manager = new McpToolsManager();
    manager.registerToolResultPostProcessor('dataSources', 'list', (result) => {
      return {
        data: result.data.map((item) => ({
          key: item.key,
          displayName: item.displayName,
        })),
      };
    });

    const tool = createCrudTool({
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

    const result = await tool.call(
      {
        resource: 'dataSources',
        action: 'list',
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
});
