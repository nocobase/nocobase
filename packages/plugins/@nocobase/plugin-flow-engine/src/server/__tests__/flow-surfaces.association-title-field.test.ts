/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import {
  assertCollectionTitleFieldExists,
  getExplicitCollectionTitleFieldName,
  isTitleableCollectionField,
  resolveAssociationSafeTitleField,
  resolveCollectionSafeTitleField,
} from '../flow-surfaces/association-title-field';

function createField(name: string, options: Record<string, any> = {}) {
  return {
    name,
    options: {
      name,
      ...options,
    },
    ...options,
  };
}

function createCollection(
  name: string,
  fields: any[],
  options: {
    titleField?: string;
    filterTargetKey?: string;
  } = {},
) {
  const fieldMap = new Map(fields.map((field) => [field.name, field]));
  const collection = {
    name,
    dataSourceKey: 'main',
    options: {
      name,
      ...options,
    },
    fields: fieldMap,
    getFields() {
      return fields;
    },
    getField(fieldName: string) {
      return fieldMap.get(fieldName);
    },
    getFieldByPath(fieldPath: string) {
      const [head] = String(fieldPath || '').split('.');
      return fieldMap.get(head);
    },
  };
  fields.forEach((field) => {
    field.collection = collection;
  });
  return collection;
}

describe('flowSurfaces association title field helpers', () => {
  it('should prefer the explicitly configured collection titleField when it exists', () => {
    const collection = createCollection(
      'skills',
      [createField('label', { interface: 'input', titleable: true }), createField('code', { interface: 'input' })],
      {
        titleField: 'label',
      },
    );

    expect(getExplicitCollectionTitleFieldName(collection)).toBe('label');
    expect(resolveCollectionSafeTitleField(collection)).toMatchObject({
      fieldName: 'label',
      source: 'explicit',
    });
  });

  it('should fall back to the first titleable field instead of a phantom filterTargetKey/id', () => {
    const collection = createCollection(
      'employees',
      [
        createField('nickname', { interface: 'input', titleable: true }),
        createField('meta', { interface: 'json', titleable: false }),
      ],
      {
        filterTargetKey: 'id',
      },
    );

    expect(resolveCollectionSafeTitleField(collection)).toMatchObject({
      fieldName: 'nickname',
      source: 'firstTitleable',
    });
  });

  it('should prefer a non-audit titleable field before createdAt/updatedAt fallback fields', () => {
    const collection = createCollection('funds', [
      createField('createdAt', { interface: 'createdAt' }),
      createField('updatedAt', { interface: 'updatedAt' }),
      createField('name', { interface: 'input', titleable: true }),
    ]);

    expect(resolveCollectionSafeTitleField(collection)).toMatchObject({
      fieldName: 'name',
      source: 'firstTitleable',
    });
  });

  it('should resolve association target titleField from explicit collection config or first titleable fallback', () => {
    const employees = createCollection('employees', [createField('nickname', { interface: 'input', titleable: true })]);
    const skills = createCollection('skills', [createField('label', { interface: 'input', titleable: true })], {
      titleField: 'label',
    });
    const collections = new Map([
      ['employees', employees],
      ['skills', skills],
    ]);

    const managerField = createField('manager', {
      type: 'belongsTo',
      interface: 'm2o',
      target: 'employees',
    });
    const skillField = createField('skill', {
      type: 'belongsTo',
      interface: 'm2o',
      target: 'skills',
    });

    expect(
      resolveAssociationSafeTitleField(managerField, 'main', (_dataSourceKey, collectionName) =>
        collections.get(collectionName),
      ),
    ).toMatchObject({
      fieldName: 'nickname',
      source: 'firstTitleable',
    });
    expect(
      resolveAssociationSafeTitleField(skillField, 'main', (_dataSourceKey, collectionName) =>
        collections.get(collectionName),
      ),
    ).toMatchObject({
      fieldName: 'label',
      source: 'explicit',
    });
  });

  it('should prefer relation field uiSchema fieldNames.label over collection-level fallback candidates', () => {
    const funds = createCollection('funds', [
      createField('createdAt', { interface: 'createdAt' }),
      createField('name', { interface: 'input', titleable: true }),
      createField('fundCode', { interface: 'input', titleable: true }),
    ]);
    const collections = new Map([['funds', funds]]);
    const fundField = createField('fund', {
      type: 'belongsTo',
      interface: 'm2o',
      target: 'funds',
      uiSchema: {
        'x-component-props': {
          fieldNames: {
            label: 'name',
          },
        },
      },
    });

    expect(
      resolveAssociationSafeTitleField(fundField, 'main', (_dataSourceKey, collectionName) =>
        collections.get(collectionName),
      ),
    ).toMatchObject({
      fieldName: 'name',
      source: 'relationFieldLabel',
    });
  });

  it('should keep collection explicit titleField fallback when relation field label is absent', () => {
    const roles = createCollection(
      'roles',
      [createField('name', { interface: 'input', titleable: true }), createField('slug', { interface: 'input' })],
      {
        titleField: 'name',
      },
    );
    const collections = new Map([['roles', roles]]);
    const roleField = createField('role', {
      type: 'belongsTo',
      interface: 'm2o',
      target: 'roles',
    });

    expect(
      resolveAssociationSafeTitleField(roleField, 'main', (_dataSourceKey, collectionName) =>
        collections.get(collectionName),
      ),
    ).toMatchObject({
      fieldName: 'name',
      source: 'explicit',
    });
  });

  it('should ignore an invalid relation field label and fall back to collection-safe resolution', () => {
    const funds = createCollection('funds', [
      createField('createdAt', { interface: 'createdAt' }),
      createField('shortName', { interface: 'input', titleable: true }),
    ]);
    const collections = new Map([['funds', funds]]);
    const fundField = createField('fund', {
      type: 'belongsTo',
      interface: 'm2o',
      target: 'funds',
      uiSchema: {
        'x-component-props': {
          fieldNames: {
            label: 'missingField',
          },
        },
      },
    });

    expect(
      resolveAssociationSafeTitleField(fundField, 'main', (_dataSourceKey, collectionName) =>
        collections.get(collectionName),
      ),
    ).toMatchObject({
      fieldName: 'shortName',
      source: 'firstTitleable',
    });
  });

  it('should reject invalid explicit collection titleField config and expose titleable detection', () => {
    const collection = createCollection(
      'broken_targets',
      [createField('name', { interface: 'input', titleable: true }), createField('meta', { interface: 'json' })],
      {
        titleField: 'missing',
      },
    );

    expect(isTitleableCollectionField(collection.getField('name'))).toBe(true);
    expect(isTitleableCollectionField(collection.getField('meta'))).toBe(false);
    expect(() => assertCollectionTitleFieldExists(collection, 'missing')).toThrow(
      "flowSurfaces collection 'broken_targets' titleField 'missing' not found",
    );
    expect(() => resolveCollectionSafeTitleField(collection)).toThrow(
      "flowSurfaces collection 'broken_targets' titleField 'missing' not found",
    );
  });

  it('should treat interface-level titleUsable metadata as a valid first titleable fallback', () => {
    const collection = createCollection('employees', [
      createField('nickname', {
        interface: 'input',
        getInterfaceOptions() {
          return { titleUsable: true };
        },
      }),
      createField('meta', {
        interface: 'json',
        getInterfaceOptions() {
          return { titleUsable: false };
        },
      }),
    ]);

    expect(isTitleableCollectionField(collection.getField('nickname'))).toBe(true);
    expect(resolveCollectionSafeTitleField(collection)).toMatchObject({
      fieldName: 'nickname',
      source: 'firstTitleable',
    });
  });

  it('should return null when collection has no explicit or usable titleField candidates', () => {
    const collection = createCollection('opaque_targets', [createField('meta', { interface: 'json' })], {
      filterTargetKey: 'id',
    });

    expect(resolveCollectionSafeTitleField(collection)).toBeNull();
  });
});
