/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { simplifyCollectionsListResult, simplifyFieldsListResult } from '../mcp-post-processors';

describe('simplifyCollectionsListResult', () => {
  it('should compress collection metadata for MCP browsing', () => {
    const result = simplifyCollectionsListResult({
      data: [
        {
          key: 'vi5fvvon9vo',
          name: 'posts',
          title: 'Posts',
          filterTargetKey: 'name',
          fields: [{ name: 'id' }, { name: 'title' }, { name: 'content' }],
        },
      ],
      meta: {
        count: 1,
      },
    });

    expect(result).toEqual({
      data: [
        {
          key: 'vi5fvvon9vo',
          name: 'posts',
          title: 'Posts',
          description: undefined,
        },
      ],
      meta: {
        count: 1,
      },
      nextActions: [
        'Use collections:get with filterByTk=<collectionName> to inspect one collection in detail.',
        'Use collections.fields:list with sourceId=<collectionName> to inspect fields when needed.',
      ],
    });
  });

  it('should compress field metadata for MCP browsing', () => {
    const result = simplifyFieldsListResult([
      {
        key: 'field_1',
        name: 'title',
        type: 'string',
        uiSchema: {
          title: 'Title',
        },
        description: 'Post title',
        collectionName: 'posts',
        interface: 'input',
      },
    ]);

    expect(result).toEqual({
      data: [
        {
          key: 'field_1',
          name: 'title',
          type: 'string',
          title: 'Title',
          description: 'Post title',
          collectionName: 'posts',
        },
      ],
      meta: undefined,
    });
  });
});
