/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { DataSource, DataSourceManager } from '../index';
import { FlowEngine } from '../../flowEngine';

describe('DataSource & Collection APIs', () => {
  const makeManager = () => {
    const m = new DataSourceManager();
    const engine = new FlowEngine();
    m.setFlowEngine(engine);
    return { m, engine };
  };

  it('add/remove/upsert data sources and collections; lookup helpers', () => {
    const { m, engine } = makeManager();
    const ds = new DataSource({ key: 'main' });
    m.addDataSource(ds);
    ds.addCollection({ name: 'posts', fields: [{ name: 'title', type: 'string', interface: 'text' }] });
    ds.addCollection({
      name: 'categories',
      fields: [
        { name: 'name', type: 'string', interface: 'text' },
        { name: 'posts', type: 'hasMany', target: 'posts', interface: 'o2m' },
      ],
    });

    // getCollection & getCollectionField
    const posts = m.getCollection('main', 'posts');
    expect(posts?.name).toBe('posts');
    const titleField = ds.getCollectionField('posts.title');
    expect(titleField?.name).toBe('title');

    // association lookup
    const assoc = ds.getAssociation('categories.posts');
    expect(assoc?.target).toBe('posts');

    // upsert collection
    ds.upsertCollection({
      name: 'posts',
      fields: [
        { name: 'title', type: 'string', interface: 'text' },
        { name: 'body', type: 'string', interface: 'text' },
      ],
    });
    const bodyField = ds.getCollection('posts')!.getField('body');
    expect(bodyField?.name).toBe('body');

    // remove collection
    ds.removeCollection('categories');
    expect(ds.getCollection('categories')).toBeUndefined();
  });

  it('sortCollectionsByInherits orders and detects cycles', () => {
    const { m } = makeManager();
    const ds = new DataSource({ key: 'main' });
    m.addDataSource(ds);
    const cm = ds.collectionManager;

    const ordered = cm.sortCollectionsByInherits([
      { name: 'base' },
      { name: 'sub', inherits: ['base'] },
      { name: 'sub2', inherits: ['sub'] },
    ]);
    expect(ordered.map((c) => c.name)).toEqual(['base', 'sub', 'sub2']);

    // cycle
    expect(() =>
      cm.sortCollectionsByInherits([
        { name: 'a', inherits: ['b'] },
        { name: 'b', inherits: ['a'] },
      ]),
    ).toThrow(/circular/);
  });
});
