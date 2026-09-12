/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { DataSource, DataSourceManager, getCollectionFieldInterface, isFieldInterfaceMatch } from '../index';
import { FlowEngine } from '../../flowEngine';

describe('Collection/Field helpers', () => {
  const setup = () => {
    const m = new DataSourceManager();
    const engine = new FlowEngine();
    m.setFlowEngine(engine);
    const ds = new DataSource({ key: 'main' });
    m.addDataSource(ds);
    return { m, ds };
  };

  it('isFieldInterfaceMatch works with wildcard/string/array', () => {
    expect(isFieldInterfaceMatch('*', 'text')).toBe(true);
    expect(isFieldInterfaceMatch('text', 'text')).toBe(true);
    expect(isFieldInterfaceMatch(['select', 'text'], 'text')).toBe(true);
    expect(isFieldInterfaceMatch(['select', '*'], 'any')).toBe(true);
    expect(isFieldInterfaceMatch(null as any, 'text')).toBe(false);
  });

  it('relationship helpers and related collections', () => {
    const { ds } = setup();
    ds.addCollection({
      name: 'posts',
      fields: [
        { name: 'title', type: 'string', interface: 'text' },
        { name: 'category', type: 'belongsTo', target: 'categories', interface: 'm2o' },
      ],
    });
    ds.addCollection({
      name: 'categories',
      fields: [
        { name: 'name', type: 'string', interface: 'text' },
        { name: 'posts', type: 'hasMany', target: 'posts', interface: 'o2m' },
      ],
    });

    const posts = ds.getCollection('posts')!;
    const related = posts.getRelatedCollections();
    expect(related.map((c) => c.name)).toContain('categories');
    expect(posts.hasRelationshipFields()).toBe(true);

    // nested path resolution
    const field = posts.getFieldByPath('category.name');
    expect(field?.name).toBe('name');
  });

  it('resolves collection field interfaces from the first available manager', () => {
    const first = { collectionFieldInterfaceManager: { getFieldInterface: vi.fn((name) => ({ name })) } };
    const second = { collectionFieldInterfaceManager: { getFieldInterface: vi.fn((name) => ({ name })) } };

    expect(getCollectionFieldInterface('input', {}, first, second)).toEqual({ name: 'input' });
    expect(first.collectionFieldInterfaceManager.getFieldInterface).toHaveBeenCalledWith('input');
    expect(second.collectionFieldInterfaceManager.getFieldInterface).not.toHaveBeenCalled();
    expect(getCollectionFieldInterface(undefined, first)).toBeUndefined();
    expect(getCollectionFieldInterface('input', {})).toBeUndefined();
  });

  it('uses collection field interface resolver from getInterfaceOptions', () => {
    const { ds, m } = setup();
    const ctx = m.flowEngine.context;
    const getOwnerFieldInterface = vi.fn((name: string) => ({ name, source: 'owner' }));
    const getLegacyFieldInterface = vi.fn((name: string) => ({ name, source: 'legacy' }));

    ctx.defineProperty('app', {
      value: {
        dataSourceManager: {
          collectionFieldInterfaceManager: {
            getFieldInterface: getLegacyFieldInterface,
          },
        },
      },
    });
    ds.addCollection({
      name: 'posts',
      fields: [{ name: 'title', type: 'string', interface: 'input' }],
    });

    const field = ds.getCollection('posts')!.getField('title')!;
    expect(field.getInterfaceOptions()).toEqual({ name: 'input', source: 'legacy' });

    m.setCollectionFieldInterfaceManager({ getFieldInterface: getOwnerFieldInterface });
    expect(field.getInterfaceOptions()).toEqual({ name: 'input', source: 'owner' });
    expect(getLegacyFieldInterface).toHaveBeenCalledTimes(1);
  });
});
