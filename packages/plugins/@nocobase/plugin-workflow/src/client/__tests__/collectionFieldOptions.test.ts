/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import { getCollectionFieldOptions } from '../variable';

const compile = (value: unknown) => value;

describe('getCollectionFieldOptions', () => {
  it('enriches a primary foreign key with its association target without changing field order', () => {
    const fields = [
      {
        name: 'id',
        type: 'bigInt',
        interface: 'integer',
        collectionName: 'profiles',
        primaryKey: true,
        isForeignKey: true,
        uiSchema: { title: 'ID' },
      },
      {
        name: 'displayName',
        type: 'string',
        interface: 'input',
        collectionName: 'profiles',
        uiSchema: { title: 'Display name' },
      },
      {
        name: 'user',
        type: 'belongsTo',
        interface: 'm2o',
        collectionName: 'profiles',
        target: 'users',
        targetKey: 'id',
        foreignKey: 'id',
        uiSchema: { title: 'User' },
      },
    ];
    const collectionManager = {
      getCollectionAllFields: () => fields,
    };

    const result = getCollectionFieldOptions({ collection: 'profiles', compile, collectionManager });

    expect(result.map((option) => option.value)).toEqual(['id', 'displayName']);
    expect(result[0].field).toMatchObject({
      name: 'id',
      primaryKey: true,
      isForeignKey: true,
      target: 'users',
      targetKey: 'id',
    });
  });

  it('continues to normalize a non-primary relation foreign key', () => {
    const fields = [
      { name: 'id', type: 'bigInt', interface: 'integer', primaryKey: true, uiSchema: { title: 'ID' } },
      {
        name: 'author',
        type: 'belongsTo',
        interface: 'm2o',
        target: 'users',
        targetKey: 'id',
        foreignKey: 'authorId',
        uiSchema: { title: 'Author' },
      },
      {
        name: 'authorId',
        type: 'bigInt',
        interface: 'integer',
        isForeignKey: true,
        uiSchema: { title: 'Author ID' },
      },
    ];
    const collectionManager = {
      getCollectionAllFields: () => fields,
    };

    const result = getCollectionFieldOptions({ collection: 'posts', compile, collectionManager });

    expect(result.map((option) => option.value)).toEqual(['id', 'authorId']);
    expect(result[1].field).toMatchObject({
      name: 'authorId',
      isForeignKey: true,
      target: 'users',
      targetKey: 'id',
    });
  });
});
