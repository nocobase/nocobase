/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { buildImportFieldOptions, type ImportFieldOptionSource } from '../buildImportFieldOptions';

function createField(name: string, overrides: Partial<ImportFieldOptionSource> = {}): ImportFieldOptionSource {
  return {
    name,
    interface: 'input',
    uiSchema: {
      title: name,
    },
    ...overrides,
  };
}

describe('buildImportFieldOptions', () => {
  it('keeps importable plain fields and excludes unsupported fields', () => {
    const options = buildImportFieldOptions(
      [
        createField('title'),
        createField('createdAt', { interface: 'createdAt' }),
        createField('noInterface', { interface: undefined }),
      ],
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

  it('expands relation fields and disables relations without importable children', () => {
    const fieldsByTarget: Record<string, ImportFieldOptionSource[]> = {
      users: [createField('nickname'), createField('createdBy', { interface: 'createdBy' })],
      empty: [createField('createdAt', { interface: 'createdAt' })],
    };

    const options = buildImportFieldOptions(
      [
        createField('author', { interface: 'm2o', type: 'belongsTo', target: 'users' }),
        createField('emptyRelation', { interface: 'm2o', type: 'belongsTo', target: 'empty' }),
      ],
      (field) => field.name,
      (field) => fieldsByTarget[field.target || ''] || [],
    );

    expect(options).toEqual([
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
      {
        name: 'emptyRelation',
        title: 'emptyRelation',
        schema: {
          title: 'emptyRelation',
        },
        disabled: true,
      },
    ]);
  });

  it('disables nested relation fields after the first relation level', () => {
    const fieldsByTarget: Record<string, ImportFieldOptionSource[]> = {
      posts: [
        createField('title'),
        createField('category', { interface: 'm2o', type: 'belongsTo', target: 'categories' }),
      ],
      categories: [createField('name')],
    };

    const options = buildImportFieldOptions(
      [createField('posts', { interface: 'o2m', type: 'hasMany', target: 'posts' })],
      (field) => field.name,
      (field) => fieldsByTarget[field.target || ''] || [],
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
            name: 'title',
            title: 'title',
            schema: {
              title: 'title',
            },
            disabled: false,
          },
          {
            name: 'category',
            title: 'category',
            schema: {
              title: 'category',
            },
            disabled: true,
          },
        ],
      },
    ]);
  });

  it('handles empty field lists', () => {
    expect(
      buildImportFieldOptions(
        undefined,
        (field) => field.name,
        () => [],
      ),
    ).toEqual([]);
    expect(
      buildImportFieldOptions(
        null,
        (field) => field.name,
        () => [],
      ),
    ).toEqual([]);
  });
});
