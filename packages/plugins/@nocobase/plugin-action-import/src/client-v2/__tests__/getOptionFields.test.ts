/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { type ImportFieldOptionSource } from '../buildImportFieldOptions';
import { getOptionFields } from '../getOptionFields';

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

describe('getOptionFields', () => {
  it('builds translated options from target collection fields', () => {
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
    const t = vi.fn(() => '');
    const fields = [
      createField('author', {
        interface: 'm2o',
        type: 'belongsTo',
        target: 'users',
        uiSchema: {},
      }),
    ];

    expect(getOptionFields(fields, t)).toEqual([
      {
        name: 'author',
        title: 'author',
        schema: {},
        disabled: true,
      },
    ]);
  });
});
