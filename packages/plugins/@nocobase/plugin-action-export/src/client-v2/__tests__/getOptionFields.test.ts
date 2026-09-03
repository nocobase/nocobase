/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import {
  createLazyOptionFieldsCache,
  getLazyOptionChildren,
  getLazyOptionFields,
  getOptionFields,
} from '../getOptionFields';

function createField(name: string, overrides: Record<string, unknown> = {}) {
  return {
    name,
    interface: 'input',
    uiSchema: {
      title: name,
    },
    ...overrides,
  };
}

describe('getOptionFields', () => {
  it('builds eager options from target collection fields with translated titles', () => {
    const fields = [
      createField('title', {
        uiSchema: {},
      }),
      createField('author', {
        interface: 'm2o',
        type: 'belongsTo',
        target: 'users',
        uiSchema: {
          title: 'Author',
        },
        targetCollection: {
          getFields: () => [createField('nickname', { uiSchema: { title: 'Nickname' } })],
        },
      }),
    ];

    expect(getOptionFields(fields, (title?: string) => (title ? `t:${title}` : ''))).toEqual([
      {
        name: 'title',
        title: 'title',
        schema: {},
        disabled: false,
      },
      {
        name: 'author',
        title: 't:Author',
        schema: {
          title: 'Author',
        },
        disabled: false,
        children: [
          {
            name: 'nickname',
            title: 't:Nickname',
            schema: {
              title: 'Nickname',
            },
            disabled: false,
          },
        ],
      },
    ]);
  });

  it('falls back to field names and empty target fields', () => {
    const relationField = createField('author', {
      interface: 'm2o',
      type: 'belongsTo',
      target: 'users',
      uiSchema: {},
    });
    const t = vi.fn(() => '');

    expect(getOptionFields([relationField], t)).toEqual([
      {
        name: 'author',
        title: 'author',
        schema: {},
        disabled: true,
      },
    ]);
    expect(getLazyOptionFields([createField('title', { uiSchema: {} })], t)).toMatchObject([
      {
        name: 'title',
        title: 'title',
        isLeaf: true,
      },
    ]);
    expect(getLazyOptionChildren({ name: 'plain' }, t)).toEqual([]);
  });

  it('falls back while resolving lazy children and cached children', () => {
    const t = vi.fn(() => '');
    const relationField = createField('author', {
      interface: 'm2o',
      type: 'belongsTo',
      target: 'users',
      uiSchema: {},
      targetCollection: {
        getFields: () => [createField('nickname', { uiSchema: {} })],
      },
    });
    const [lazyOption] = getLazyOptionFields([relationField], t);

    expect(getLazyOptionChildren(lazyOption, t)).toMatchObject([
      {
        name: 'nickname',
        title: 'nickname',
      },
    ]);

    const cache = createLazyOptionFieldsCache([relationField], t);
    expect(cache.loadChildren(cache.getRootOptions()[0])).toMatchObject([
      {
        name: 'nickname',
        title: 'nickname',
      },
    ]);

    const emptyCache = createLazyOptionFieldsCache(
      [
        createField('emptyRelation', {
          interface: 'm2o',
          type: 'belongsTo',
          target: 'empty',
        }),
      ],
      t,
    );
    expect(emptyCache.loadChildren(emptyCache.getRootOptions()[0])).toEqual([]);
  });

  it('builds lazy options and children through target collections', () => {
    const relationField = createField('author', {
      interface: 'm2o',
      type: 'belongsTo',
      target: 'users',
      uiSchema: {
        title: 'Author',
      },
      targetCollection: {
        getFields: () => [createField('nickname', { uiSchema: { title: 'Nickname' } })],
      },
    });

    const options = getLazyOptionFields([relationField], (title?: string) => (title ? `t:${title}` : ''));

    expect(options).toMatchObject([
      {
        name: 'author',
        title: 't:Author',
        isLeaf: false,
      },
    ]);
    expect(getLazyOptionChildren(options[0], (title?: string) => (title ? `t:${title}` : ''))).toMatchObject([
      {
        name: 'nickname',
        title: 't:Nickname',
        isLeaf: true,
      },
    ]);
  });

  it('preloads lazy option paths and caches loaded children', () => {
    const getFields = vi.fn(() => [createField('nickname')]);
    const cache = createLazyOptionFieldsCache(
      [
        createField('author', {
          interface: 'm2o',
          type: 'belongsTo',
          target: 'users',
          targetCollection: {
            getFields,
          },
        }),
      ],
      (title?: string) => title || '',
    );
    const rootOptions = cache.getRootOptions();

    expect(getFields).not.toHaveBeenCalled();
    expect(cache.preloadPath([{ name: 'author' }, { name: 'nickname' }])).toBe(true);
    expect(getFields).toHaveBeenCalledTimes(1);
    expect(rootOptions[0]?.children).toMatchObject([{ name: 'nickname', isLeaf: true }]);

    expect(cache.loadChildren(rootOptions[0])).toBe(rootOptions[0]?.children);
    expect(getFields).toHaveBeenCalledTimes(1);
  });

  it('handles empty lazy children and invalid preload paths', () => {
    const cache = createLazyOptionFieldsCache(
      [
        createField('author', {
          interface: 'm2o',
          type: 'belongsTo',
          target: 'users',
          targetCollection: {
            getFields: () => [],
          },
        }),
      ],
      (title?: string) => title || '',
    );
    const rootOption = cache.getRootOptions()[0];

    expect(cache.preloadPath(['author'])).toBe(false);
    expect(cache.loadChildren(undefined)).toEqual([]);
    expect(cache.loadChildren({ name: 'title', isLeaf: true })).toEqual([]);
    expect(cache.loadChildren(rootOption)).toEqual([]);
    expect(rootOption).toMatchObject({
      isLeaf: true,
      disabled: true,
      children: [],
    });
    expect(cache.preloadPath(['missing', 'nickname'])).toBe(false);
  });
});
