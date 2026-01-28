/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Collection, CollectionField } from '../data-source';
import type { PropertyMetaFactory } from '../flowContext';

// 类型常量定义
const RELATION_FIELD_TYPES = ['belongsTo', 'hasOne', 'hasMany', 'belongsToMany', 'belongsToArray'] as const;
const NUMERIC_FIELD_TYPES = ['integer', 'float', 'double', 'decimal'] as const;

/**
 * 创建字段的完整元数据（统一处理关联和非关联字段）
 */
function createFieldMetadata(field: CollectionField, includeNonFilterable?: boolean) {
  const baseProperties = createMetaBaseProperties(field);

  if (field.isAssociationField()) {
    const targetCollection = field.targetCollection;
    if (!targetCollection) {
      // 没有目标集合的关联字段，当作普通 object 处理
      return {
        type: 'object',
        ...baseProperties,
      };
    }

    return {
      type: 'object', // 所有关系字段统一使用 object 类型
      ...baseProperties,
      properties: async () => {
        const subProperties: Record<string, any> = {};
        targetCollection.fields.forEach((subField) => {
          if (includeNonFilterable || subField.filterable) {
            subProperties[subField.name] = createFieldMetadata(subField, includeNonFilterable);
          }
        });
        return subProperties;
      },
    };
  }

  // 非关联字段处理
  return {
    type: getFieldType(field),
    ...baseProperties,
  };
}

/**
 * 将字段类型转换为元数据类型
 */
function getFieldType(field: CollectionField) {
  const fieldType = field.type;

  // 关系字段统一映射为 object 类型
  if (RELATION_FIELD_TYPES.includes(fieldType)) {
    return 'object';
  }

  // 数字类型
  if (NUMERIC_FIELD_TYPES.includes(fieldType)) {
    return 'number';
  }

  // 其他类型映射
  switch (fieldType) {
    case 'boolean':
      return 'boolean';
    case 'json':
      return 'object';
    case 'array':
      return 'array';
    default:
      return 'string'; // string, text, date, datetime, time等
  }
}

/**
 * 创建字段的基础属性（标题、接口、UI模式等）
 */
function createMetaBaseProperties(field: CollectionField) {
  return {
    title: field.title || field.name,
    interface: field.interface,
    options: field.options,
    uiSchema: field.uiSchema || {},
  };
}

export function createCollectionContextMeta(
  collectionOrFactory: Collection | (() => Collection | null),
  title?: string,
  includeNonFilterable?: boolean,
): PropertyMetaFactory {
  const metaFn: PropertyMetaFactory = async () => {
    const collection = typeof collectionOrFactory === 'function' ? collectionOrFactory() : collectionOrFactory;

    if (!collection) {
      // 返回 null 表示 meta 暂不可用，不会导致整个 meta tree 构建失败
      return null;
    }

    return {
      type: 'object',
      title: title || collection.title || collection.name,
      properties: async () => {
        const properties: Record<string, any> = {};

        // 添加所有字段
        collection.fields.forEach((field) => {
          if (includeNonFilterable || field.filterable) {
            properties[field.name] = createFieldMetadata(field, includeNonFilterable);
          }
        });

        return properties;
      },
    };
  };
  metaFn.title = title;
  return metaFn;
}
