/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render } from '@nocobase/test/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CommentBlockInitializer } from '../CommentBlockInitializer';

const { insert, getCollection, createCommentBlockUISchema } = vi.hoisted(() => ({
  insert: vi.fn(),
  getCollection: vi.fn(),
  createCommentBlockUISchema: vi.fn((options) => options),
}));
let dataBlockInitializerProps: Record<string, any> | undefined;

vi.mock('@nocobase/client', () => ({
  DataBlockInitializer: (props: Record<string, any>) => {
    dataBlockInitializerProps = props;
    return null;
  },
  useCollectionManager_deprecated: () => ({ getCollection }),
  useSchemaInitializer: () => ({ insert }),
  useSchemaInitializerItem: () => ({
    name: 'dataBlocks.comment',
    title: 'Comment',
  }),
}));

vi.mock('../../createCommentBlockUISchema', () => ({
  createCommentBlockUISchema,
}));

describe('CommentBlockInitializer', () => {
  beforeEach(() => {
    insert.mockReset();
    getCollection.mockReset();
    createCommentBlockUISchema.mockClear();
    dataBlockInitializerProps = undefined;
    getCollection.mockReturnValue({ filterTargetKey: 'commentId' });
  });

  it('uses association schema when creating from an association field in popup others mode', async () => {
    render(
      <CommentBlockInitializer
        filterCollections={vi.fn()}
        filterOtherRecordsCollection={vi.fn()}
        onlyCurrentDataSource
      />,
    );

    await dataBlockInitializerProps?.onCreateBlockSchema({
      item: {
        name: 'comments',
        dataSource: 'main',
        associationField: {
          collectionName: 'posts',
          name: 'comments',
        },
      },
      fromOthersInPopup: true,
    });

    expect(createCommentBlockUISchema).toHaveBeenCalledWith({
      dataSource: 'main',
      rowKey: 'commentId',
      association: 'posts.comments',
    });
    expect(insert).toHaveBeenCalledWith({
      dataSource: 'main',
      rowKey: 'commentId',
      association: 'posts.comments',
    });
  });

  it('uses plain collection schema when no association field is selected', async () => {
    render(
      <CommentBlockInitializer
        filterCollections={vi.fn()}
        filterOtherRecordsCollection={vi.fn()}
        onlyCurrentDataSource
      />,
    );

    await dataBlockInitializerProps?.onCreateBlockSchema({
      item: {
        name: 'comments',
        dataSource: 'main',
      },
    });

    expect(createCommentBlockUISchema).toHaveBeenCalledWith({
      collectionName: 'comments',
      dataSource: 'main',
      rowKey: 'commentId',
    });
    expect(insert).toHaveBeenCalledWith({
      collectionName: 'comments',
      dataSource: 'main',
      rowKey: 'commentId',
    });
  });
});
