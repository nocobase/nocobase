/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  getCollectionFields,
  getFieldInterface,
  getFieldName,
  getFieldType,
  isAssociationField,
} from './service-helpers';

const CURRENT_COLLECTION_FOREIGN_KEY_RELATION_TYPES = new Set(['belongsto']);
const CURRENT_COLLECTION_FOREIGN_KEY_RELATION_INTERFACES = new Set(['m2o']);
const CONDITIONAL_CURRENT_COLLECTION_FOREIGN_KEY_RELATION_INTERFACES = new Set(['o2o']);
const RELATION_INTERFACES_WITH_FOREIGN_KEYS_OUTSIDE_CURRENT_COLLECTION = new Set(['o2m', 'm2m', 'mbm']);
const RELATION_TYPES_WITH_FOREIGN_KEYS_OUTSIDE_CURRENT_COLLECTION = new Set(['hasone', 'hasmany', 'belongstomany']);

export function collectRelationBackingForeignKeyNames(collection: any): Set<string> {
  const fields = getCollectionFields(collection);
  const scalarFieldNames = new Set(
    fields
      .filter((field) => !isAssociationField(field))
      .map((field) => String(getFieldName(field) || '').trim())
      .filter(Boolean),
  );
  const names = new Set<string>();
  fields.forEach((field) => {
    const foreignKey = getCurrentCollectionRelationForeignKey(field);
    if (foreignKey && scalarFieldNames.has(foreignKey)) {
      names.add(foreignKey);
    }
  });
  return names;
}

export function isRelationBackingForeignKeyField(collection: any, fieldOrFieldName: any): boolean {
  const fieldName =
    typeof fieldOrFieldName === 'string'
      ? fieldOrFieldName.trim()
      : String(getFieldName(fieldOrFieldName) || '').trim();
  return !!fieldName && collectRelationBackingForeignKeyNames(collection).has(fieldName);
}

function getCurrentCollectionRelationForeignKey(field: any) {
  if (!isAssociationField(field)) {
    return '';
  }
  if (!relationCanStoreForeignKeyInCurrentCollection(field)) {
    return '';
  }
  return String(field?.foreignKey || field?.options?.foreignKey || '').trim();
}

function relationCanStoreForeignKeyInCurrentCollection(field: any) {
  const type = String(getFieldType(field) || '')
    .trim()
    .toLowerCase();
  const fieldInterface = String(getFieldInterface(field) || '')
    .trim()
    .toLowerCase();
  if (
    RELATION_TYPES_WITH_FOREIGN_KEYS_OUTSIDE_CURRENT_COLLECTION.has(type) ||
    RELATION_INTERFACES_WITH_FOREIGN_KEYS_OUTSIDE_CURRENT_COLLECTION.has(fieldInterface)
  ) {
    return false;
  }
  return (
    CURRENT_COLLECTION_FOREIGN_KEY_RELATION_TYPES.has(type) ||
    CURRENT_COLLECTION_FOREIGN_KEY_RELATION_INTERFACES.has(fieldInterface) ||
    CONDITIONAL_CURRENT_COLLECTION_FOREIGN_KEY_RELATION_INTERFACES.has(fieldInterface)
  );
}
