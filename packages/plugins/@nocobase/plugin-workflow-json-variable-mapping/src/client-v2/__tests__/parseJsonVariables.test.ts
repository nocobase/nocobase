/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import { ARRAY_KEY_IN_PATH } from '../../contants';
import { parseJsonVariables } from '../utils/parseJsonVariables';

function createKeyFactory() {
  let index = 0;
  return () => `key-${++index}`;
}

describe('parseJsonVariables', () => {
  it('extracts object paths and preserves the variable item shape', () => {
    expect(
      parseJsonVariables(
        {
          user: {
            name: 'NocoBase',
          },
          count: 1,
        },
        false,
        createKeyFactory(),
      ),
    ).toEqual([
      { key: 'key-1', path: 'user', name: 'user', paths: ['user'] },
      { key: 'key-2', path: 'user.name', name: 'name', paths: ['user', 'name'] },
      { key: 'key-3', path: 'count', name: 'count', paths: ['count'] },
    ]);
  });

  it('collapses array items to the array path when parseArray is false', () => {
    expect(
      parseJsonVariables(
        {
          rows: [{ name: 'a' }, { name: 'b', score: 1 }],
        },
        false,
        createKeyFactory(),
      ),
    ).toEqual([
      { key: 'key-1', path: 'rows', name: 'rows', paths: ['rows'] },
      { key: 'key-2', path: 'rows[].name', name: 'name', paths: ['rows', ARRAY_KEY_IN_PATH, 'name'] },
      { key: 'key-4', path: 'rows[].score', name: 'score', paths: ['rows', ARRAY_KEY_IN_PATH, 'score'] },
    ]);
  });

  it('includes concrete array indexes when parseArray is true', () => {
    expect(
      parseJsonVariables(
        {
          rows: [{ name: 'a' }, { score: 1 }],
        },
        true,
        createKeyFactory(),
      ),
    ).toEqual([
      { key: 'key-1', path: 'rows', name: 'rows', paths: ['rows'] },
      { key: 'key-2', path: 'rows.0', name: '0', paths: ['rows', '0'] },
      { key: 'key-3', path: 'rows.0.name', name: 'name', paths: ['rows', '0', 'name'] },
      { key: 'key-4', path: 'rows.1', name: '1', paths: ['rows', '1'] },
      { key: 'key-5', path: 'rows.1.score', name: 'score', paths: ['rows', '1', 'score'] },
    ]);
  });

  it('returns an empty list for non-object examples', () => {
    expect(parseJsonVariables(null, false, createKeyFactory())).toEqual([]);
    expect(parseJsonVariables('not json', false, createKeyFactory())).toEqual([]);
  });
});
