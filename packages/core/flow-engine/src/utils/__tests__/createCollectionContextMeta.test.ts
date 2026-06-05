/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { createCollectionContextMeta } from '../createCollectionContextMeta';
import { FlowEngine } from '../../flowEngine';
import { CollectionFieldInterfaceManager } from '../../../../client/src/data-source/collection-field-interface/CollectionFieldInterfaceManager';

describe('createCollectionContextMeta', () => {
  it('filters association sub fields when includeNonFilterable is false', async () => {
    const engine = new FlowEngine();
    const dm = engine.dataSourceManager as any;
    dm.collectionFieldInterfaceManager = new CollectionFieldInterfaceManager([], {}, dm);
    engine.context.defineProperty('app', { value: { dataSourceManager: dm } });
    const ds = dm.getDataSource('main')!;

    ds.addCollection({
      name: 'users',
      fields: [
        { name: 'id', type: 'integer', interface: 'number', filterable: true },
        { name: 'email', type: 'string', interface: 'text', filterable: true },
        { name: 'nickname', type: 'string', interface: 'text' }, // 未声明 filterable
        { name: 'rawUserPayload', type: 'json', filterable: true },
      ],
    });

    ds.addCollection({
      name: 'posts',
      fields: [
        { name: 'title', type: 'string', interface: 'text', filterable: true },
        { name: 'author', type: 'belongsTo', target: 'users', interface: 'm2o', filterable: true },
        { name: 'rawPostPayload', type: 'json', filterable: true },
      ],
    });

    const posts = ds.getCollection('posts')!;
    const metaFactory = createCollectionContextMeta(posts, 'Posts', false);
    const meta = await metaFactory();
    const props = await (meta?.properties as any)?.();
    const authorMeta: any = props?.author;
    const authorFields = await authorMeta?.properties?.();

    expect(props).toHaveProperty('title');
    expect(props).toHaveProperty('author');
    expect(props).not.toHaveProperty('rawPostPayload');
    expect(authorFields).toBeTruthy();
    expect(authorFields).toHaveProperty('email');
    expect(authorFields).not.toHaveProperty('nickname');
    expect(authorFields).not.toHaveProperty('rawUserPayload');
  });

  it('keeps interfaced non-filterable fields but hides fields without interface when includeNonFilterable is true', async () => {
    const engine = new FlowEngine();
    const dm = engine.dataSourceManager as any;
    dm.collectionFieldInterfaceManager = new CollectionFieldInterfaceManager([], {}, dm);
    engine.context.defineProperty('app', { value: { dataSourceManager: dm } });
    const ds = dm.getDataSource('main')!;

    ds.addCollection({
      name: 'users',
      fields: [
        { name: 'id', type: 'integer', interface: 'number', filterable: true },
        { name: 'email', type: 'string', interface: 'text', filterable: true },
        { name: 'nickname', type: 'string', interface: 'text' },
        { name: 'rawUserPayload', type: 'json', filterable: true },
      ],
    });

    ds.addCollection({
      name: 'posts',
      fields: [
        { name: 'title', type: 'string', interface: 'text', filterable: true },
        { name: 'internalName', type: 'string', interface: 'text' },
        { name: 'rawPostPayload', type: 'json', filterable: true },
        { name: 'author', type: 'belongsTo', target: 'users', interface: 'm2o', filterable: true },
      ],
    });

    const posts = ds.getCollection('posts')!;
    const metaFactory = createCollectionContextMeta(posts, 'Posts', true);
    const meta = await metaFactory();
    const props = await (meta?.properties as any)?.();
    const authorFields = await props?.author?.properties?.();

    expect(props).toHaveProperty('title');
    expect(props).toHaveProperty('internalName');
    expect(props).toHaveProperty('author');
    expect(props).not.toHaveProperty('rawPostPayload');
    expect(authorFields).toHaveProperty('email');
    expect(authorFields).toHaveProperty('nickname');
    expect(authorFields).not.toHaveProperty('rawUserPayload');
  });
});
