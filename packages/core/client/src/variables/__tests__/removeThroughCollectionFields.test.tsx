/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { removeThroughCollectionFields } from '../VariablesProvider';

describe('removeThroughCollectionFields', () => {
  it('should remove through collection fields from a single record', () => {
    const value = {
      id: 1,
      name: 'John Doe',
      throughField: 'Some value',
    };
    const associationField = {
      through: 'throughField',
    };
    const result = removeThroughCollectionFields(value, associationField);
    expect(result).toEqual({
      id: 1,
      name: 'John Doe',
    });
  });

  it('should remove through collection fields from an array of records', () => {
    const value = [
      {
        id: 1,
        name: 'John Doe',
        throughField: 'Some value',
      },
      {
        id: 2,
        name: 'Jane Smith',
        throughField: 'Another value',
      },
    ];
    const associationField = {
      through: 'throughField',
    };
    const result = removeThroughCollectionFields(value, associationField);
    expect(result).toEqual([
      {
        id: 1,
        name: 'John Doe',
      },
      {
        id: 2,
        name: 'Jane Smith',
      },
    ]);
  });

  it('should return the original value if associationField.through is not defined', () => {
    const value = {
      id: 1,
      name: 'John Doe',
    };
    const associationField = {};
    const result = removeThroughCollectionFields(value, associationField);
    expect(result).toEqual(value);
  });

  it('should return the original value if value is null or undefined', () => {
    const associationField = {
      through: 'throughField',
    };
    let value = null;
    let result = removeThroughCollectionFields(value, associationField);
    expect(result).toBeNull();

    value = undefined;
    result = removeThroughCollectionFields(value, associationField);
    expect(result).toBeUndefined();
  });
});
