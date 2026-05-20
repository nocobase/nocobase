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
  buildExportFieldLazyChildren,
  buildExportFieldLazyOptions,
  buildExportFieldOptions,
  createExportFieldLazyOptionsCache,
} from '../buildExportFieldOptions';
import { createExportFieldsOptionsSnapshot, normalizeExportFieldValue } from '../exportFieldValue';

const createField = (overrides: Record<string, any> = {}) => ({
  name: 'field',
  interface: 'input',
  uiSchema: {
    title: overrides.name || 'field',
  },
  ...overrides,
});

describe('buildExportFieldOptions', () => {
  it('keeps root plain fields selectable', () => {
    const options = buildExportFieldOptions(
      [createField({ name: 'title' })],
      (field) => field.name,
      () => [],
    );

    expect(options).toEqual([
      {
        name: 'title',
        title: 'title',
        schema: {
          title: 'title',
        },
        disabled: false,
      },
    ]);
  });

  it('does not allow exporting relation objects directly', () => {
    const relationField = createField({
      name: 'user',
      interface: 'm2o',
      type: 'belongsTo',
      target: 'users',
    });

    const options = buildExportFieldOptions(
      [relationField],
      (field) => field.name,
      () => [],
    );

    expect(options).toEqual([
      {
        name: 'user',
        title: 'user',
        schema: {
          title: 'user',
        },
        disabled: true,
      },
    ]);
  });

  it('allows to-many relations to expand to a to-one relation but hides another to-many relation', () => {
    const fieldsByTarget = {
      comments: [
        createField({ name: 'content' }),
        createField({ name: 'author', interface: 'm2o', type: 'belongsTo', target: 'users' }),
        createField({ name: 'tags', interface: 'm2m', type: 'belongsToMany', target: 'tags' }),
      ],
      users: [createField({ name: 'nickname' })],
    };

    const options = buildExportFieldOptions(
      [createField({ name: 'comments', interface: 'o2m', type: 'hasMany', target: 'comments' })],
      (field) => field.name,
      (field) => fieldsByTarget[field.target] || [],
    );

    expect(options).toEqual([
      {
        name: 'comments',
        title: 'comments',
        schema: {
          title: 'comments',
        },
        disabled: false,
        children: [
          {
            name: 'content',
            title: 'content',
            schema: {
              title: 'content',
            },
            disabled: false,
          },
          {
            name: 'author',
            title: 'author',
            schema: {
              title: 'author',
            },
            disabled: false,
            children: [
              {
                name: 'nickname',
                title: 'nickname',
                schema: {
                  title: 'nickname',
                },
                disabled: false,
              },
            ],
          },
        ],
      },
    ]);
  });

  it('allows two relation levels after a to-one relation and hides deeper relation fields', () => {
    const fieldsByTarget = {
      users: [
        createField({ name: 'nickname' }),
        createField({ name: 'department', interface: 'm2o', type: 'belongsTo', target: 'departments' }),
        createField({ name: 'posts', interface: 'o2m', type: 'hasMany', target: 'posts' }),
      ],
      departments: [
        createField({ name: 'title' }),
        createField({ name: 'manager', interface: 'm2o', type: 'belongsTo', target: 'managers' }),
      ],
      posts: [
        createField({ name: 'subject' }),
        createField({ name: 'category', interface: 'm2o', type: 'belongsTo', target: 'categories' }),
      ],
    };

    const options = buildExportFieldOptions(
      [createField({ name: 'user', interface: 'm2o', type: 'belongsTo', target: 'users' })],
      (field) => field.name,
      (field) => fieldsByTarget[field.target] || [],
    );

    expect(options).toEqual([
      {
        name: 'user',
        title: 'user',
        schema: {
          title: 'user',
        },
        disabled: false,
        children: [
          {
            name: 'nickname',
            title: 'nickname',
            schema: {
              title: 'nickname',
            },
            disabled: false,
          },
          {
            name: 'department',
            title: 'department',
            schema: {
              title: 'department',
            },
            disabled: false,
            children: [
              {
                name: 'title',
                title: 'title',
                schema: {
                  title: 'title',
                },
                disabled: false,
              },
            ],
          },
          {
            name: 'posts',
            title: 'posts',
            schema: {
              title: 'posts',
            },
            disabled: false,
            children: [
              {
                name: 'subject',
                title: 'subject',
                schema: {
                  title: 'subject',
                },
                disabled: false,
              },
            ],
          },
        ],
      },
    ]);
  });

  it('does not allow a second to-many relation in the path and hides it', () => {
    const fieldsByTarget = {
      comments: [
        createField({ name: 'content' }),
        createField({ name: 'tags', interface: 'm2m', type: 'belongsToMany', target: 'tags' }),
      ],
    };

    const options = buildExportFieldOptions(
      [createField({ name: 'posts', interface: 'o2m', type: 'hasMany', target: 'comments' })],
      (field) => field.name,
      (field) => fieldsByTarget[field.target] || [],
    );

    expect(options).toEqual([
      {
        name: 'posts',
        title: 'posts',
        schema: {
          title: 'posts',
        },
        disabled: false,
        children: [
          {
            name: 'content',
            title: 'content',
            schema: {
              title: 'content',
            },
            disabled: false,
          },
        ],
      },
    ]);
  });

  it('builds lazy root options without traversing target collection fields', () => {
    const options = buildExportFieldLazyOptions(
      [
        createField({ name: 'title' }),
        createField({ name: 'user', interface: 'm2o', type: 'belongsTo', target: 'users' }),
      ],
      (field) => field.name,
    );

    expect(options).toMatchObject([
      {
        name: 'title',
        title: 'title',
        isLeaf: true,
      },
      {
        name: 'user',
        title: 'user',
        isLeaf: false,
      },
    ]);
    expect(options[1]).not.toHaveProperty('children');
    expect(Object.keys(options[1])).toEqual(['name', 'title', 'schema', 'disabled', 'isLeaf']);
  });

  it('loads lazy children with the same relation nesting restrictions', () => {
    const parentOption = buildExportFieldLazyOptions(
      [createField({ name: 'comments', interface: 'o2m', type: 'hasMany', target: 'comments' })],
      (field) => field.name,
    )[0];

    const children = buildExportFieldLazyChildren(
      parentOption,
      (field) => field.name,
      () => [
        createField({ name: 'content' }),
        createField({ name: 'author', interface: 'm2o', type: 'belongsTo', target: 'users' }),
        createField({ name: 'tags', interface: 'm2m', type: 'belongsToMany', target: 'tags' }),
      ],
    );

    expect(children).toMatchObject([
      {
        name: 'content',
        isLeaf: true,
      },
      {
        name: 'author',
        isLeaf: false,
      },
    ]);
    expect(children.map((option) => option.name)).not.toContain('tags');
  });

  it('shares lazy option cache and does not traverse relation fields until requested', () => {
    const getTargetFields = vi.fn((field) => {
      if (field.target === 'users') {
        return [createField({ name: 'nickname' })];
      }
      return [];
    });
    const cache = createExportFieldLazyOptionsCache(
      [createField({ name: 'user', interface: 'm2o', type: 'belongsTo', target: 'users' })],
      (field) => field.name,
      getTargetFields,
    );

    const rootOptions = cache.getRootOptions();
    expect(getTargetFields).not.toHaveBeenCalled();
    expect(rootOptions[0]).not.toHaveProperty('children');

    expect(cache.preloadPath(['user', 'nickname'])).toBe(true);
    expect(getTargetFields).toHaveBeenCalledTimes(1);
    expect(rootOptions[0]?.children).toMatchObject([{ name: 'nickname', isLeaf: true }]);

    expect(cache.preloadPath(['user', 'nickname'])).toBe(false);
    expect(getTargetFields).toHaveBeenCalledTimes(1);
  });

  it('creates a new root options snapshot after lazy children are loaded', () => {
    const cache = createExportFieldLazyOptionsCache(
      [createField({ name: 'file_m2m', interface: 'm2m', type: 'belongsToMany', target: 'files' })],
      (field) => field.name,
      () => [createField({ name: 'nickname' })],
    );

    const firstOptions = createExportFieldsOptionsSnapshot(cache);
    cache.loadChildren(firstOptions[0]);
    const nextOptions = createExportFieldsOptionsSnapshot(cache);

    expect(nextOptions).not.toBe(firstOptions);
    expect(nextOptions[0]?.children).toMatchObject([{ name: 'nickname', isLeaf: true }]);
  });

  it('normalizes cascader value without selected option metadata', () => {
    expect(
      normalizeExportFieldValue([
        { name: 'file_m2m', title: 'File', children: [{ name: 'createdBy' }] },
        { name: 'createdBy', title: 'Created by', children: [{ name: 'nickname' }] },
        { name: 'nickname', title: 'Nickname', schema: { title: 'Nickname' } },
      ]),
    ).toEqual(['file_m2m', 'createdBy', 'nickname']);

    expect(normalizeExportFieldValue(['file_m2m', 'createdBy', 'nickname'])).toEqual([
      'file_m2m',
      'createdBy',
      'nickname',
    ]);
    expect(normalizeExportFieldValue([{ name: 'file_m2m' }, 'createdBy', { name: 'nickname' }])).toEqual([
      'file_m2m',
      'createdBy',
      'nickname',
    ]);
    expect(normalizeExportFieldValue([])).toBeNull();
  });
});
