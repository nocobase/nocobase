/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import {
  simplifyDataSourceCollectionsListResult,
  simplifyDataSourceFieldsListResult,
  simplifyDataSourceListResult,
} from '../mcp-post-processors';

describe('simplifyDataSourceListResult', () => {
  it('should compress data source list payloads for MCP browsing', () => {
    const result = simplifyDataSourceListResult({
      data: [
        {
          key: 'analytics',
          displayName: 'Analytics',
          description: 'BI database',
          status: 'loaded',
          type: 'postgres',
        },
      ],
      meta: {
        count: 1,
      },
    });

    expect(result).toEqual({
      data: [
        {
          displayName: 'Analytics',
          key: 'analytics',
          type: 'postgres',
          status: 'loaded',
        },
      ],
      meta: {
        count: 1,
      },
    });
  });

  it('should compress nested collections and fields in data source list payloads', () => {
    const result = simplifyDataSourceListResult({
      data: [
        {
          key: 'analytics',
          displayName: 'Analytics',
          collections: [
            {
              name: 'roles',
              title: 'roles',
              description: null,
              fields: [
                {
                  name: 'createdAt',
                  type: 'datetimeTz',
                  description: null,
                  uiSchema: {
                    title: 'createdAt',
                  },
                },
              ],
            },
          ],
        },
      ],
    });

    expect(result).toEqual({
      data: [
        {
          displayName: 'Analytics',
          key: 'analytics',
          type: undefined,
          status: undefined,
          collections: [
            {
              name: 'roles',
              title: 'roles',
              description: undefined,
              dataSourceKey: 'analytics',
              fields: [
                {
                  name: 'createdAt',
                  type: 'datetimeTz',
                  title: 'createdAt',
                  description: null,
                  dataSourceKey: 'analytics',
                  collectionName: 'roles',
                },
              ],
            },
          ],
        },
      ],
      meta: undefined,
    });
  });

  it('should compress external collection list payloads for MCP browsing', () => {
    const result = simplifyDataSourceCollectionsListResult([
      {
        name: 'orders',
        title: 'Orders',
        description: 'Order records',
        dataSourceKey: 'analytics',
        fields: [{ name: 'id' }],
      },
    ]);

    expect(result).toEqual({
      data: [
        {
          name: 'orders',
          title: 'Orders',
          description: 'Order records',
          dataSourceKey: 'analytics',
        },
      ],
      meta: undefined,
    });
  });

  it('should compress external field list payloads for MCP browsing', () => {
    const result = simplifyDataSourceFieldsListResult(
      [
        {
          name: 'amount',
          type: 'decimal',
          description: 'Order amount',
          uiSchema: {
            title: 'Amount',
          },
        },
      ],
      {
        args: {
          associatedIndex: 'analytics.orders',
        },
      },
    );

    expect(result).toEqual({
      data: [
        {
          name: 'amount',
          type: 'decimal',
          title: 'Amount',
          description: 'Order amount',
          dataSourceKey: 'analytics',
          collectionName: 'orders',
        },
      ],
      meta: undefined,
    });
  });
});
