/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { buildImportFieldOptions } from '../buildImportFieldOptions';

const createField = (overrides: Record<string, any> = {}) => ({
  name: 'field',
  interface: 'input',
  uiSchema: {
    title: overrides.name || 'field',
  },
  ...overrides,
});

describe('buildImportFieldOptions', () => {
  it('keeps root plain fields selectable', () => {
    const options = buildImportFieldOptions(
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

  it('filters excluded audit fields', () => {
    const options = buildImportFieldOptions(
      [createField({ name: 'createdAt', interface: 'createdAt' })],
      (field) => field.name,
      () => [],
    );

    expect(options).toEqual([]);
  });

  it('does not allow importing relation objects directly', () => {
    const relationField = createField({
      name: 'user',
      interface: 'm2o',
      type: 'belongsTo',
      target: 'users',
    });

    const options = buildImportFieldOptions(
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

  it('limits relation fields to a single relation level', () => {
    const fieldsByTarget = {
      users: [
        createField({ name: 'content' }),
        createField({ name: 'author', interface: 'm2o', type: 'belongsTo', target: 'users' }),
        createField({ name: 'posts', interface: 'o2m', type: 'hasMany', target: 'posts' }),
      ],
    };

    const options = buildImportFieldOptions(
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
            disabled: true,
          },
          {
            name: 'posts',
            title: 'posts',
            schema: {
              title: 'posts',
            },
            disabled: true,
          },
        ],
      },
    ]);
  });
});
