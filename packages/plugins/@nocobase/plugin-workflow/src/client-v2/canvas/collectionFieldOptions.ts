/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Field-tree builder shared by the legacy and modern canvases (ADR-0003,
 * migration doc §6/§9.7). Relocated verbatim from `src/client/variable.tsx` —
 * the ~250-line, bug-prone heart of the variable system (relation lazy-load,
 * type filtering, foreign-key splicing). It is deliberately NOT rewritten
 * during the dual-canvas migration; instead both canvases share this one copy.
 *
 * It is a pure function cluster: dependencies (`compile`, `collectionManager`)
 * are injected as parameters, so it carries no React hooks and no `ctx` read,
 * and works identically whether v1 injects `useCompile()` or v2 injects
 * `useT()`. v1 re-exports these from here; the v1 golden-baseline tests re-run
 * unchanged against this copy.
 *
 * It produces the legacy `VariableOption` shape (direction NOT reversed); the
 * modern canvas converts to `MetaTreeNode` with a separate adapter at the end.
 *
 * `parseCollectionName` is inlined (a byte-identical 8-line string split from
 * `@nocobase/data-source-manager`) to avoid pulling a new cross-package
 * dependency into client-v2 for a trivial helper; the `main:roles` baseline
 * test pins its behavior.
 */

import { uniqBy } from 'lodash';
import type React from 'react';

// Minimal structural type for the injected collection manager — only the one method the field-tree logic calls. Avoids
// importing the concrete `CollectionManager` from `@nocobase/client` (iron rule).
export type FieldTreeCollectionManager = {
  getCollectionAllFields(collection: string): any[];
};

export type VariableOption = {
  key?: string;
  value?: string;
  label?: string | React.ReactNode;
  children?: VariableOption[] | null;
  [key: string]: any;
};

export type VariableDataType =
  | 'boolean'
  | 'number'
  | 'string'
  | 'date'
  | {
      type: 'reference';
      options: {
        collection: string;
        multiple?: boolean;
        entity?: boolean;
      };
    }
  | ((field: any, options: { collectionManager?: FieldTreeCollectionManager }) => boolean);

export type UseVariableOptions = {
  types?: VariableDataType[];
  fieldNames?: {
    label?: string;
    value?: string;
    children?: string;
  };
  appends?: string[] | null;
  depth?: number;
};

export const defaultFieldNames = { label: 'label', value: 'value', children: 'children' } as const;

/**
 * @deprecated
 */
export const BaseTypeSets = {
  boolean: new Set(['checkbox']),
  number: new Set(['integer', 'number', 'percent']),
  string: new Set(['input', 'password', 'email', 'phone', 'select', 'radioGroup', 'text', 'markdown', 'richText']),
  date: new Set(['datetime', 'datetimeNoTz', 'dateOnly', 'createdAt', 'updatedAt']),
};

// Inlined from `@nocobase/data-source-manager` (byte-identical) — see file header.
function parseCollectionName(collection: string) {
  if (!collection) {
    return [];
  }
  const dataSourceCollection = collection.split(':');
  const collectionName = dataSourceCollection.pop();
  const dataSourceName = dataSourceCollection[0] ?? 'main';
  return [dataSourceName, collectionName];
}

function matchFieldType(
  field,
  type: VariableDataType,
  { collectionManager }: { collectionManager?: FieldTreeCollectionManager },
): boolean {
  if (typeof type === 'string') {
    return BaseTypeSets[type]?.has(field.interface);
  }

  if (typeof type === 'object' && type.type === 'reference') {
    if (isAssociationField(field)) {
      return (
        type.options?.entity && (field.collectionName === type.options?.collection || type.options?.collection === '*')
      );
    } else if (field.isForeignKey) {
      return (
        (field.collectionName === type.options?.collection && field.name === 'id') ||
        field.target === type.options?.collection
      );
    } else {
      return false;
    }
  }

  if (typeof type === 'function') {
    return type(field, { collectionManager });
  }

  return false;
}

function isAssociationField(field): boolean {
  return ['belongsTo', 'hasOne', 'hasMany', 'belongsToMany', 'belongsToArray'].includes(field.type);
}

function getNextAppends(field, appends: string[] | null): string[] | null {
  if (appends == null) {
    return null;
  }
  const fieldPrefix = `${field.name}.`;
  return appends.filter((item) => item.startsWith(fieldPrefix)).map((item) => item.replace(fieldPrefix, ''));
}

function filterTypedFields({ fields, types, appends, depth = 1, compile, collectionManager }) {
  return fields.filter((field) => {
    const match = types?.length ? types.some((type) => matchFieldType(field, type, { collectionManager })) : true;
    if (isAssociationField(field)) {
      if (appends === null) {
        if (!depth) {
          return false;
        }
        return (
          match ||
          filterTypedFields({
            fields: getNormalizedFields(field.target, { compile, collectionManager }),
            types,
            depth: depth - 1,
            appends,
            compile,
            collectionManager,
          })
        );
      }
      const nextAppends = getNextAppends(field, appends);
      const included = appends.includes(field.name);
      if (match) {
        return included;
      } else {
        return (
          (nextAppends?.length || included) &&
          filterTypedFields({
            fields: getNormalizedFields(field.target, { compile, collectionManager }),
            types,
            // depth: depth - 1,
            appends: nextAppends,
            compile,
            collectionManager,
          }).length
        );
      }
    } else {
      return match;
    }
  });
}

function getNormalizedFields(collectionName, { compile, collectionManager }) {
  // NOTE: for compatibility with legacy version
  const [, collection] = parseCollectionName(collectionName);
  // NOTE: `dataSourceName` will be ignored in new version
  const fields = collectionManager.getCollectionAllFields(collection);
  const fkFields: any[] = [];
  const result: any[] = [];
  fields.forEach((field) => {
    if (field.isForeignKey && !field.primaryKey) {
      fkFields.push(field);
    } else {
      const fkField = fields.find((f) => f.name === field.foreignKey);
      if (fkField) {
        fkFields.push(fkField);
      }
      result.push(field);
    }
  });
  const foreignKeyFields = uniqBy(fkFields, 'name');
  // NOTE: for all foreignKey fields
  for (let i = result.length - 1; i >= 0; i--) {
    const field = result[i];
    if (field.type === 'belongsTo') {
      const foreignKeyFieldIndex = foreignKeyFields.findIndex((f) => f.name === field.foreignKey);
      if (foreignKeyFieldIndex > -1) {
        const foreignKeyField = foreignKeyFields[foreignKeyFieldIndex];
        result.splice(i, 0, {
          ...foreignKeyField,
          target: field.target,
          targetKey: field.targetKey,
          interface: foreignKeyField.interface ?? field.interface,
          isForeignKey: true,
          uiSchema: {
            ...field.uiSchema,
            ...foreignKeyField.uiSchema,
            title: foreignKeyField.uiSchema?.title ? compile(foreignKeyField.uiSchema?.title) : foreignKeyField.name,
          },
        });
        foreignKeyFields.splice(foreignKeyFieldIndex, 1);
      } else {
        result.splice(i, 0, {
          ...field,
          name: field.foreignKey,
          type: 'bigInt',
          isForeignKey: true,
          interface: field.interface,
          uiSchema: {
            ...field.uiSchema,
            title: field.uiSchema?.title ? `${compile(field.uiSchema?.title)} ID` : field.name,
          },
        });
      }
    } else if (field.type === 'context' && field.collectionName === 'users') {
      result.splice(i, 1);
    }
  }
  result.push(...foreignKeyFields);

  return uniqBy(result, 'name').filter((field) => field.interface && !field.hidden);
}

function loadChildren(option) {
  const appends = getNextAppends(option.field, option.appends);
  const result = getCollectionFieldOptions({
    collection: `${
      option.field.dataSourceKey && option.field.dataSourceKey !== 'main' ? `${option.field.dataSourceKey}:` : ''
    }${option.field.target}`,
    types: option.types,
    appends,
    depth: option.depth - 1,
    ...this,
  });
  option.loadChildren = null;
  if (result.length) {
    option.children = result;
  } else {
    option.isLeaf = true;
    const matchingType = option.types
      ? option.types.some((type) => matchFieldType(option.field, type, { collectionManager: this.collectionManager }))
      : true;
    if (!matchingType) {
      option.disabled = true;
    }
  }
}

export function getCollectionFieldOptions(options): VariableOption[] {
  const {
    fields,
    collection,
    types,
    appends = [],
    depth = 1,
    compile,
    collectionManager,
    fieldNames = defaultFieldNames,
  } = options;
  const computedFields = fields ?? getNormalizedFields(collection, { compile, collectionManager });
  const boundLoadChildren = loadChildren.bind({ compile, collectionManager, fieldNames });

  const result: VariableOption[] = filterTypedFields({
    fields: computedFields,
    types,
    depth,
    appends,
    compile,
    collectionManager,
  }).map((field) => {
    const label = compile(field.uiSchema?.title || field.name);
    const nextAppends = getNextAppends(field, appends);
    // TODO: no matching fields in next appends should consider isLeaf as true
    const isLeaf =
      !isAssociationField(field) || (nextAppends && !nextAppends.length && !appends.includes(field.name)) || false;

    return {
      [fieldNames.label]: label,
      key: field.name,
      [fieldNames.value]: field.name,
      isLeaf,
      loadChildren: isLeaf ? null : boundLoadChildren,
      field,
      depth,
      appends,
      types,
    };
  });

  return result;
}
