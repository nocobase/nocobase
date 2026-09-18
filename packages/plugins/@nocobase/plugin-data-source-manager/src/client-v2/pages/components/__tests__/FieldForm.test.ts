/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  filterConfigureSelectOption,
  getForeignKeyFieldOptions,
  resolveConfigureSelectControlBehavior,
  resolveForeignKeyCollectionName,
} from '../FieldForm';

describe('resolveConfigureSelectControlBehavior', () => {
  it('enables search for relation target collections by default', () => {
    expect(resolveConfigureSelectControlBehavior('target', 'Select').showSearch).toBe(true);
  });

  it('respects an explicit relation target search setting', () => {
    expect(resolveConfigureSelectControlBehavior('target', 'Select', { showSearch: false }).showSearch).toBe(false);
  });

  it('applies ordinary select behavior from component props', () => {
    expect(
      resolveConfigureSelectControlBehavior('type', 'Select', {
        allowClear: false,
        autoSelectFirstOption: true,
        showSearch: true,
      }),
    ).toEqual({
      allowClear: false,
      autoSelectFirstOption: true,
      showSearch: true,
    });
  });

  it('applies the fixed source key component policy', () => {
    expect(
      resolveConfigureSelectControlBehavior('sourceKey', 'SourceKey', {
        allowClear: true,
        autoSelectFirstOption: false,
        showSearch: false,
      }),
    ).toEqual({
      allowClear: false,
      autoSelectFirstOption: true,
      showSearch: true,
    });
  });

  it('enables search for target key fields', () => {
    expect(resolveConfigureSelectControlBehavior('targetKey', 'TargetKey').showSearch).toBe(true);
  });

  it('enables search for foreign key fields', () => {
    expect(resolveConfigureSelectControlBehavior('foreignKey', 'ForeignKey').showSearch).toBe(true);
  });
});

describe('resolveForeignKeyCollectionName', () => {
  it('resolves the current collection for belongsTo', () => {
    expect(
      resolveForeignKeyCollectionName({
        collectionName: 'users',
        target: 'orgs',
        through: 'users_orgs',
        type: 'belongsTo',
      }),
    ).toBe('users');
  });

  it('resolves the target collection for hasOne and hasMany', () => {
    expect(resolveForeignKeyCollectionName({ collectionName: 'users', target: 'orgs', type: 'hasOne' })).toBe('orgs');
    expect(resolveForeignKeyCollectionName({ collectionName: 'users', target: 'orgs', type: 'hasMany' })).toBe('orgs');
  });

  it('resolves the through collection for belongsToMany', () => {
    expect(
      resolveForeignKeyCollectionName({
        collectionName: 'users',
        target: 'orgs',
        through: 'users_orgs',
        type: 'belongsToMany',
      }),
    ).toBe('users_orgs');
  });

  it('falls back to the target collection when the relation type is unknown', () => {
    expect(resolveForeignKeyCollectionName({ collectionName: 'users', target: 'orgs' })).toBe('orgs');
  });
});

describe('getForeignKeyFieldOptions', () => {
  const t = (key: string) => key;

  it('keeps only the storage types that can hold a foreign key', () => {
    expect(
      getForeignKeyFieldOptions(
        [
          { name: 'orgId', type: 'bigInt', uiSchema: { title: 'Organization id' } },
          { name: 'code', type: 'string' },
          { name: 'payload', type: 'json' },
          { name: 'orgs', type: 'belongsToMany' },
        ],
        t,
      ),
    ).toEqual([
      { label: 'Organization id', value: 'orgId' },
      { label: 'code', value: 'code' },
    ]);
  });

  it('returns no options when the collection fields are missing', () => {
    expect(getForeignKeyFieldOptions(undefined, t)).toEqual([]);
  });
});

describe('filterConfigureSelectOption', () => {
  const option = { label: 'Customer Orders', value: 'customer_orders' };

  it('matches a collection display title case-insensitively', () => {
    expect(filterConfigureSelectOption('ORDERS', option)).toBe(true);
  });

  it('matches a collection internal name', () => {
    expect(filterConfigureSelectOption('customer_', option)).toBe(true);
  });

  it('rejects unrelated collection names', () => {
    expect(filterConfigureSelectOption('products', option)).toBe(false);
  });
});
