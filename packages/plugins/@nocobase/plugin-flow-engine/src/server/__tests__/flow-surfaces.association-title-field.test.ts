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
import { resolveRelationFieldType } from '../flow-surfaces/field-type-resolver';

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

function expectThrownTitleFieldError(
  run: () => void,
  expected: {
    path?: string;
    ruleId: string;
    action?: string;
    fieldPath?: string;
    titleField?: string;
    targetCollection?: string;
    invalidReason?: string;
  },
) {
  try {
    run();
    throw new Error('Expected titleField error');
  } catch (error: any) {
    if (error?.message === 'Expected titleField error') {
      throw error;
    }
    const item = error?.toResponseBody?.()?.errors?.[0];
    expect(item).toMatchObject({
      ruleId: expected.ruleId,
      details: expect.objectContaining({
        ...(expected.action ? { action: expected.action } : {}),
        ...(expected.fieldPath ? { fieldPath: expected.fieldPath } : {}),
        ...(expected.titleField ? { titleField: expected.titleField } : {}),
        ...(expected.targetCollection ? { targetCollection: expected.targetCollection } : {}),
        ...(expected.invalidReason ? { invalidReason: expected.invalidReason } : {}),
      }),
    });
    if (expected.path) {
      expect(item.path).toBe(expected.path);
    }
    expect(item.details?.suggestion).toEqual(expect.any(String));
  }
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

  it('should reject id as a relation field uiSchema title field with direct-write context', () => {
    const funds = createCollection('funds', [
      createField('id', { interface: 'snowflakeId', primaryKey: true }),
      createField('name', { interface: 'input', titleable: true }),
    ]);
    const collections = new Map([['funds', funds]]);
    const fundField = createField('fund', {
      type: 'belongsTo',
      interface: 'm2o',
      target: 'funds',
      uiSchema: {
        'x-component-props': {
          fieldNames: {
            label: 'id',
          },
        },
      },
    });

    expectThrownTitleFieldError(
      () =>
        resolveAssociationSafeTitleField(
          fundField,
          'main',
          (_dataSourceKey, collectionName) => collections.get(collectionName),
          {
            action: 'addField',
            path: '$.titleField',
            fieldPath: 'fund',
          },
        ),
      {
        path: '$.titleField',
        ruleId: 'relation-titleField-unreadable',
        action: 'addField',
        fieldPath: 'fund',
        titleField: 'id',
        targetCollection: 'funds',
        invalidReason: 'id',
      },
    );
  });

  it('should reject association relation field labels with direct-write context', () => {
    const parentField = createField('parentFund', {
      type: 'belongsTo',
      interface: 'm2o',
      target: 'funds',
    });
    const funds = createCollection('funds', [
      createField('name', { interface: 'input', titleable: true }),
      parentField,
    ]);
    const collections = new Map([['funds', funds]]);
    const fundField = createField('fund', {
      type: 'belongsTo',
      interface: 'm2o',
      target: 'funds',
      uiSchema: {
        'x-component-props': {
          fieldNames: {
            label: 'parentFund',
          },
        },
      },
    });

    expectThrownTitleFieldError(
      () =>
        resolveAssociationSafeTitleField(
          fundField,
          'main',
          (_dataSourceKey, collectionName) => collections.get(collectionName),
          {
            action: 'configure',
            path: '$.changes.titleField',
            fieldPath: 'fund',
          },
        ),
      {
        path: '$.changes.titleField',
        ruleId: 'relation-titleField-unreadable',
        action: 'configure',
        fieldPath: 'fund',
        titleField: 'parentFund',
        targetCollection: 'funds',
        invalidReason: 'association',
      },
    );
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

  it('should reject explicit collection titleField id through association default resolution', () => {
    const brokenRoles = createCollection(
      'broken_roles',
      [createField('id', { interface: 'snowflakeId', primaryKey: true }), createField('name', { interface: 'input' })],
      {
        titleField: 'id',
      },
    );
    const collections = new Map([['broken_roles', brokenRoles]]);
    const rolesField = createField('roles', {
      type: 'belongsToMany',
      interface: 'm2m',
      target: 'broken_roles',
    });

    expectThrownTitleFieldError(
      () =>
        resolveAssociationSafeTitleField(
          rolesField,
          'main',
          (_dataSourceKey, collectionName) => collections.get(collectionName),
          {
            action: 'addField',
            path: '$.titleField',
            fieldPath: 'roles',
          },
        ),
      {
        path: '$.titleField',
        ruleId: 'relation-titleField-unreadable',
        action: 'addField',
        fieldPath: 'roles',
        titleField: 'id',
        targetCollection: 'broken_roles',
        invalidReason: 'id',
      },
    );
  });

  it('should reject relation fieldType id titleField compatibility', () => {
    const roles = createCollection('roles', [createField('name', { interface: 'input', titleable: true })]);
    const users = createCollection('users', [
      createField('roles', {
        type: 'belongsToMany',
        interface: 'm2m',
        target: 'roles',
      }),
    ]);
    const collections = new Map([
      ['roles', roles],
      ['users', users],
    ]);
    const rolesField = users.getField('roles');

    expectThrownTitleFieldError(
      () =>
        resolveRelationFieldType({
          fieldType: 'picker',
          containerUse: 'FormItemModel',
          field: rolesField,
          dataSourceKey: 'main',
          getCollection: (_dataSourceKey, collectionName) => collections.get(collectionName),
          fields: ['name'],
          titleField: 'id',
          context: 'fields[0]',
          actionName: 'addField',
          titleFieldPath: '$.titleField',
          fieldPath: 'roles',
        }),
      {
        path: '$.titleField',
        ruleId: 'relation-titleField-unreadable',
        action: 'addField',
        fieldPath: 'roles',
        titleField: 'id',
        targetCollection: 'roles',
        invalidReason: 'id',
      },
    );
    expectThrownTitleFieldError(
      () =>
        resolveRelationFieldType({
          fieldType: 'picker',
          containerUse: 'FormItemModel',
          field: rolesField,
          dataSourceKey: 'main',
          getCollection: (_dataSourceKey, collectionName) => collections.get(collectionName),
          fields: ['name'],
          titleField: 'missing',
          context: 'fields[0]',
          actionName: 'addField',
          titleFieldPath: '$.titleField',
          fieldPath: 'roles',
        }),
      {
        path: '$.titleField',
        ruleId: 'relation-titleField-unknown',
        action: 'addField',
        fieldPath: 'roles',
        titleField: 'missing',
        targetCollection: 'roles',
        invalidReason: 'missing',
      },
    );

    const brokenRoles = createCollection(
      'broken_roles',
      [createField('id', { interface: 'snowflakeId', primaryKey: true }), createField('name', { interface: 'input' })],
      {
        titleField: 'id',
      },
    );
    const usersWithBrokenRoles = createCollection('users_with_broken_roles', [
      createField('roles', {
        type: 'belongsToMany',
        interface: 'm2m',
        target: 'broken_roles',
      }),
    ]);
    const brokenCollections = new Map([
      ['broken_roles', brokenRoles],
      ['users_with_broken_roles', usersWithBrokenRoles],
    ]);

    expectThrownTitleFieldError(
      () =>
        resolveRelationFieldType({
          fieldType: 'picker',
          containerUse: 'FormItemModel',
          field: usersWithBrokenRoles.getField('roles'),
          dataSourceKey: 'main',
          getCollection: (_dataSourceKey, collectionName) => brokenCollections.get(collectionName),
          context: 'addField',
          actionName: 'addField',
          titleFieldPath: '$.fieldType',
          fieldPath: 'roles',
        }),
      {
        path: '$.fieldType',
        ruleId: 'relation-titleField-unreadable',
        action: 'addField',
        fieldPath: 'roles',
        titleField: 'id',
        targetCollection: 'broken_roles',
        invalidReason: 'id',
      },
    );
  });

  it('should reject explicit collection titleField id', () => {
    const collection = createCollection(
      'id_targets',
      [createField('id', { interface: 'snowflakeId', primaryKey: true }), createField('name', { interface: 'input' })],
      {
        titleField: 'id',
      },
    );

    expect(() => assertCollectionTitleFieldExists(collection, 'id')).toThrow("flowSurfaces titleField cannot use 'id'");
    expect(() => resolveCollectionSafeTitleField(collection)).toThrow("flowSurfaces titleField cannot use 'id'");
  });

  it('should expose structured direct-write titleField errors', () => {
    const collection = createCollection('employees', [
      createField('id', { interface: 'snowflakeId', primaryKey: true }),
      createField('nickname', { interface: 'input' }),
      createField('manager', { type: 'belongsTo', interface: 'm2o', target: 'employees' }),
    ]);

    expectThrownTitleFieldError(
      () =>
        assertCollectionTitleFieldExists(collection, 'id', {
          action: 'configure',
          path: '$.changes.titleField',
          fieldPath: 'manager',
        }),
      {
        path: '$.changes.titleField',
        ruleId: 'relation-titleField-unreadable',
        action: 'configure',
        fieldPath: 'manager',
        titleField: 'id',
        targetCollection: 'employees',
        invalidReason: 'id',
      },
    );
    expectThrownTitleFieldError(
      () =>
        assertCollectionTitleFieldExists(collection, 'missing', {
          action: 'addField',
          path: '$.titleField',
          fieldPath: 'manager',
        }),
      {
        path: '$.titleField',
        ruleId: 'relation-titleField-unknown',
        action: 'addField',
        fieldPath: 'manager',
        titleField: 'missing',
        targetCollection: 'employees',
        invalidReason: 'missing',
      },
    );
    expectThrownTitleFieldError(
      () =>
        assertCollectionTitleFieldExists(collection, 'manager', {
          action: 'configure',
          path: '$.changes.titleField',
          fieldPath: 'manager',
        }),
      {
        path: '$.changes.titleField',
        ruleId: 'relation-titleField-unreadable',
        action: 'configure',
        fieldPath: 'manager',
        titleField: 'manager',
        targetCollection: 'employees',
        invalidReason: 'association',
      },
    );
  });

  it('should expose truncated titleField candidates in structured direct-write errors', () => {
    const readableFields = Array.from({ length: 21 }, (_item, index) =>
      createField(`field${index + 1}`, { interface: 'input' }),
    );
    const collection = createCollection('wide_targets', [
      createField('id', { interface: 'snowflakeId', primaryKey: true }),
      ...readableFields,
      createField('parent', { type: 'belongsTo', interface: 'm2o', target: 'wide_targets' }),
    ]);

    try {
      assertCollectionTitleFieldExists(collection, 'missing', {
        action: 'addField',
        path: '$.titleField',
        fieldPath: 'parent',
      });
      throw new Error('Expected titleField error');
    } catch (error: any) {
      if (error?.message === 'Expected titleField error') {
        throw error;
      }
      const item = error?.toResponseBody?.()?.errors?.[0];
      expect(item).toMatchObject({
        ruleId: 'relation-titleField-unknown',
        details: {
          action: 'addField',
          fieldPath: 'parent',
          titleField: 'missing',
          targetCollection: 'wide_targets',
          invalidReason: 'missing',
          availableFields: readableFields.slice(0, 20).map((field) => field.name),
          availableFieldsTruncated: true,
          suggestion: expect.any(String),
        },
      });
      expect(item.details.availableFields).not.toContain('id');
      expect(item.details.availableFields).not.toContain('parent');
      expect(item.details.availableFields).not.toContain('field21');
    }
  });

  it('should not use id as an automatic titleable fallback', () => {
    const collection = createCollection('id_only_targets', [
      createField('id', { interface: 'snowflakeId', primaryKey: true }),
      createField('meta', { interface: 'json' }),
    ]);

    expect(resolveCollectionSafeTitleField(collection)).toBeNull();
  });

  it('should not use association fields as automatic titleable fallbacks', () => {
    const scalarFallbackCollection = createCollection('scalar_fallback_targets', [
      createField('parent', {
        type: 'belongsTo',
        interface: 'm2o',
        target: 'scalar_fallback_targets',
        titleable: true,
      }),
      createField('name', { interface: 'input', titleable: true }),
    ]);
    const associationOnlyCollection = createCollection('association_only_targets', [
      createField('parent', {
        type: 'belongsTo',
        interface: 'm2o',
        target: 'association_only_targets',
        titleable: true,
      }),
      createField('meta', { interface: 'json' }),
    ]);

    expect(resolveCollectionSafeTitleField(scalarFallbackCollection)).toMatchObject({
      fieldName: 'name',
      source: 'firstTitleable',
    });
    expect(resolveCollectionSafeTitleField(associationOnlyCollection)).toBeNull();
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
