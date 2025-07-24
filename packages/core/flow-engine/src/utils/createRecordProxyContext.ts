/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RecordProxy } from '../RecordProxy';
import type { Collection } from '../data-source';
import type { FlowModelContext } from '../flowContext';

/**
 * 创建用于 FlowContext.defineProperty 的记录代理上下文。
 *
 * @param record 要代理的记录对象
 * @param collection 记录所属的集合
 * @returns 包含 get 和 meta 属性的对象，可用于 defineProperty
 *
 * @example
 * const recordContext = createRecordProxyContext(record, collection);
 * flowContext.defineProperty('currentRecord', recordContext);
 */
export function createRecordProxyContext(record: any, collection: Collection) {
  return {
    get: (flowCtx: FlowModelContext) => {
      return new RecordProxy(record, collection, flowCtx);
    },
    meta: {
      type: 'object',
      title: collection.title || collection.name,
      properties: async () => {
        const properties: Record<string, any> = {};

        // 添加记录的直接字段
        for (const [fieldName, field] of collection.fields) {
          if (field.name in record) {
            properties[field.name] = {
              type: getFieldType(field),
              title: field.title || field.name,
              interface: field.interface,
              uiSchema: field.uiSchema,
              hide: field.options?.hidden,
            };
          }
        }

        // 添加关联字段
        for (const [fieldName, field] of collection.fields) {
          if (field.isAssociationField()) {
            const targetCollection = field.targetCollection;
            if (targetCollection) {
              const isToMany = ['hasMany', 'belongsToMany', 'belongsToArray'].includes(field.type);

              properties[field.name] = {
                type: isToMany ? 'array' : 'object',
                title: field.title || field.name,
                interface: field.interface,
                uiSchema: field.uiSchema,
                hide: field.options?.hidden,
                properties: isToMany
                  ? undefined
                  : async () => {
                      // 为关联记录生成子属性
                      const subProperties: Record<string, any> = {};
                      for (const [subFieldName, subField] of targetCollection.fields) {
                        subProperties[subField.name] = {
                          type: getFieldType(subField),
                          title: subField.title || subField.name,
                          interface: subField.interface,
                          uiSchema: subField.uiSchema,
                          hide: subField.options?.hidden,
                        };
                      }
                      return subProperties;
                    },
              };
            }
          }
        }

        return properties;
      },
    },
  };
}

/**
 * 将字段类型转换为元数据类型
 */
function getFieldType(field: any): string {
  const typeMap: Record<string, string> = {
    string: 'string',
    text: 'string',
    integer: 'number',
    float: 'number',
    double: 'number',
    decimal: 'number',
    boolean: 'boolean',
    date: 'string',
    time: 'string',
    datetime: 'string',
    json: 'object',
    array: 'array',
    belongsTo: 'object',
    hasOne: 'object',
    hasMany: 'array',
    belongsToMany: 'array',
    belongsToArray: 'array',
  };

  return typeMap[field.type] || 'string';
}
