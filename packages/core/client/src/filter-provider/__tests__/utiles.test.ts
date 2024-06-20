/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getSupportFieldsByAssociation, getSupportFieldsByForeignKey, transformToFilter } from '../utils';

describe('getSupportFieldsByAssociation', () => {
  it('should return all associated fields matching the inherited collections chain', () => {
    const block = {
      associatedFields: [
        { id: 1, target: 'collection1', name: 'field1' },
        { id: 2, target: 'collection2', name: 'field2' },
        { id: 3, target: 'collection1', name: 'field3' },
      ],
    };

    const inheritCollectionsChain = ['collection1', 'collection2'];

    const result = getSupportFieldsByAssociation(inheritCollectionsChain, block as any);

    expect(result).toEqual([
      { id: 1, target: 'collection1', name: 'field1' },
      { id: 2, target: 'collection2', name: 'field2' },
      { id: 3, target: 'collection1', name: 'field3' },
    ]);
  });

  it('should return an empty array when there are no matching associated fields', () => {
    const block = {
      associatedFields: [
        { id: 1, target: 'collection1', name: 'field1' },
        { id: 2, target: 'collection2', name: 'field2' },
        { id: 3, target: 'collection1', name: 'field3' },
      ],
    };

    const inheritCollectionsChain = ['collection3', 'collection4'];

    const result = getSupportFieldsByAssociation(inheritCollectionsChain, block as any);

    expect(result).toEqual([]);
  });

  it('should return associated fields matching the inherited collections chain', () => {
    const block = {
      associatedFields: [
        { id: 1, target: 'collection1', name: 'field1' },
        { id: 2, target: 'collection2', name: 'field2' },
        { id: 3, target: 'collection1', name: 'field3' },
      ],
    };

    const inheritCollectionsChain = ['collection1'];

    const result = getSupportFieldsByAssociation(inheritCollectionsChain, block as any);

    expect(result).toEqual([
      { id: 1, target: 'collection1', name: 'field1' },
      { id: 3, target: 'collection1', name: 'field3' },
    ]);
  });
});

describe('getSupportFieldsByForeignKey', () => {
  it("should return all foreign key fields matching the filter block collection's foreign key properties", () => {
    const filterBlockCollection = {
      fields: [
        { id: 1, name: 'field1', foreignKey: 'fk1' },
        { id: 2, name: 'field2', foreignKey: 'fk2' },
        { id: 3, name: 'field3', foreignKey: 'fk3' },
      ],
    };

    const block = {
      foreignKeyFields: [
        { id: 1, name: 'fk1', target: 'collection1' },
        { id: 2, name: 'fk2', target: 'collection2' },
        { id: 3, name: 'fk4', target: 'collection1' },
      ],
    };

    const result = getSupportFieldsByForeignKey(filterBlockCollection as any, block as any);

    expect(result).toEqual([
      { id: 1, name: 'fk1', target: 'collection1' },
      { id: 2, name: 'fk2', target: 'collection2' },
    ]);
  });

  it('should return an empty array when there are no matching foreign key fields', () => {
    const filterBlockCollection = {
      fields: [
        { id: 1, name: 'field1', foreignKey: 'fk1' },
        { id: 2, name: 'field2', foreignKey: 'fk2' },
        { id: 3, name: 'field3', foreignKey: 'fk3' },
      ],
    };

    const block = {
      foreignKeyFields: [
        { id: 1, name: 'fk4', target: 'collection1' },
        { id: 2, name: 'fk5', target: 'collection2' },
        { id: 3, name: 'fk6', target: 'collection1' },
      ],
    };

    const result = getSupportFieldsByForeignKey(filterBlockCollection as any, block as any);

    expect(result).toEqual([]);
  });

  it("should return foreign key fields matching the filter block collection's foreign key properties", () => {
    const filterBlockCollection = {
      fields: [
        { id: 1, name: 'field1', foreignKey: 'fk1' },
        { id: 2, name: 'field2', foreignKey: 'fk2' },
        { id: 3, name: 'field3', foreignKey: 'fk3' },
      ],
    };

    const block = {
      foreignKeyFields: [
        { id: 1, name: 'fk1', target: 'collection1' },
        { id: 2, name: 'fk2', target: 'collection2' },
        { id: 3, name: 'fk3', target: 'collection1' },
      ],
    };

    const result = getSupportFieldsByForeignKey(filterBlockCollection as any, block as any);

    expect(result).toEqual([
      { id: 1, name: 'fk1', target: 'collection1' },
      { id: 2, name: 'fk2', target: 'collection2' },
      { id: 3, name: 'fk3', target: 'collection1' },
    ]);
  });
});

describe('transformToFilter', () => {
  const values = {
    field1: 'value1',
    field2: 'value2',
    field3: [
      {
        id: 'value3',
      },
      {
        id: 'value4',
      },
    ],
  };

  const operators = {
    field1: '$eq',
    field2: '$ne',
    field3: '$in',
  };

  const collectionName = 'collection';

  const getCollectionJoinField = vi.fn((name: string) => {
    if (name === `${collectionName}.field1`) return {};
    if (name === `${collectionName}.field2`) return {};
    if (name === `${collectionName}.field3`) return { target: 'targetCollection', targetKey: 'id' };
    return {};
  });

  it('should transform values to filter', () => {
    const expectedFilter = {
      $and: [
        {
          field1: {
            $eq: 'value1',
          },
        },
        {
          field2: {
            $ne: 'value2',
          },
        },
        {
          'field3.id': {
            $eq: ['value3', 'value4'],
          },
        },
      ],
    };

    const filter = transformToFilter(values, operators, getCollectionJoinField, collectionName);

    expect(filter).toEqual(expectedFilter);
  });

  it('should handle null values', () => {
    const valuesWithNull = {
      field1: null,
      field2: 'value2',
    };

    const expectedFilter = {
      $and: [
        {
          field2: {
            $ne: 'value2',
          },
        },
      ],
    };

    const filter = transformToFilter(valuesWithNull, operators, getCollectionJoinField, collectionName);

    expect(filter).toEqual(expectedFilter);
  });
});
