/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RecordProxy } from '../RecordProxy';
import type { Collection, CollectionField } from '../data-source';
import type { FlowModelContext } from '../flowContext';

// 类型常量定义
const RELATION_FIELD_TYPES = ['belongsTo', 'hasOne', 'hasMany', 'belongsToMany', 'belongsToArray'] as const;
const NUMERIC_FIELD_TYPES = ['integer', 'float', 'double', 'decimal'] as const;

/**
 * 创建用于 FlowContext.defineProperty 的记录代理上下文。
 *
 * @param recordOrFactory 要代理的记录对象或记录工厂函数
 * @param collectionOrFactory 记录所属的集合或获取集合的工厂函数
 * @returns 包含 get 和 meta 属性的对象，可用于 defineProperty
 *
 * @example
 * // 使用静态记录和集合
 * const recordContext = createRecordProxyContext(record, collection);
 * flowContext.defineProperty('currentRecord', recordContext);
 *
 * // 使用函数
 * const dynamicContext = createRecordProxyContext(() => getCurrentRecord(), collection);
 * flowContext.defineProperty('dynamicRecord', dynamicContext);
 *
 * // 使用延迟加载的集合
 * const lazyContext = createRecordProxyContext(
 *   () => getCurrentRecord(),
 *   () => dataSource.getCollection('users')
 * );
 * flowContext.defineProperty('userRecord', lazyContext);
 */
export function createRecordProxyContext(
  recordOrFactory: any | (() => any),
  collectionOrFactory: Collection | (() => Collection | null),
) {
  return {
    get: (flowCtx: FlowModelContext) => {
      const collection = typeof collectionOrFactory === 'function' ? collectionOrFactory() : collectionOrFactory;

      if (!collection) {
        throw new Error('Collection not available for record proxy');
      }

      return new RecordProxy(recordOrFactory, collection, flowCtx);
    },
    meta: async () => {
      const collection = typeof collectionOrFactory === 'function' ? collectionOrFactory() : collectionOrFactory;

      if (!collection) {
        // 返回 null 表示 meta 暂不可用，不会导致整个 meta tree 构建失败
        return null;
      }

      return {
        type: 'object',
        title: collection.title || collection.name,
        properties: async () => {
          const properties: Record<string, any> = {};

          // 添加所有字段
          collection.fields.forEach((field) => {
            properties[field.name] = createFieldMetadata(field);
          });

          return properties;
        },
      };
    },
  };
}

/**
 * 创建字段的完整元数据（统一处理关联和非关联字段）
 */
function createFieldMetadata(field: CollectionField) {
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
          subProperties[subField.name] = {
            type: getFieldType(subField),
            ...createMetaBaseProperties(subField),
          };
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
    uiSchema: field.uiSchema || {},
  };
}
