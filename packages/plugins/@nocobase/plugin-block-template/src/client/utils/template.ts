/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, Schema } from '@formily/json-schema';
import * as _ from 'lodash';
import { convertTplBlock } from '../initializers';

/**
 * Collects all template UIDs from a schema and its nested properties
 * @param schema The schema to collect template UIDs from
 * @param uids Set to store unique template UIDs
 * @returns Set of template UIDs
 */
export function collectAllTemplateUids(schema: ISchema, uids = new Set<string>()): Set<string> {
  if (!schema) return uids;

  if (schema['x-template-root-uid']) {
    uids.add(schema['x-template-root-uid']);
  }

  if (schema.properties) {
    for (const key in schema.properties) {
      collectAllTemplateUids(schema.properties[key], uids);
    }
  }

  return uids;
}

/**
 * Find a schema in the cache by its UID
 * @param cache The cache object containing schemas
 * @param uid The UID to search for
 * @returns The found schema or null
 */
export function findSchemaCache(cache: Record<string, any>, uid: string): any {
  const isChild = (schema: any, uid: string): boolean => {
    if (schema['x-uid'] === uid) {
      return true;
    }
    for (const key in schema.properties) {
      if (isChild(schema.properties[key], uid)) {
        return true;
      }
    }
    return false;
  };

  for (const key in cache) {
    if (isChild(cache[key], uid)) {
      return cache[key];
    }
  }
  return null;
}

/**
 * Find a schema and its parent by UID
 * @param schema The schema to search in
 * @param uid The UID to search for
 * @param parent The parent schema (used in recursion)
 * @param key The key in parent's properties (used in recursion)
 * @returns Object containing parent, schema and key, or null if not found
 */
export function findParentSchemaByUid(
  schema: any,
  uid: string,
  parent: any = null,
  key?: string,
): { parent: any; schema: any; key: string } | null {
  if (!schema) {
    return null;
  }
  if (schema['x-uid'] === uid) {
    return { parent, schema, key };
  }
  for (const key in schema.properties) {
    const result = findParentSchemaByUid(schema.properties[key], uid, schema, key);
    if (result) {
      return result;
    }
  }
  return null;
}

/**
 * Find the first virtual schema by UID
 * @param schema The schema to search in
 * @param uid The UID to search for
 * @returns Object containing schema and insertion details, or null if not found
 */
export function findFirstVirtualSchema(
  schema: any,
  uid: string,
): { schema: any; insertTarget: string; insertPosition: string } | null {
  if (!schema) {
    return null;
  }
  if (schema['x-uid'] === uid && schema['x-virtual']) {
    return {
      schema,
      insertTarget: schema['x-uid'],
      insertPosition: 'afterBegin',
    };
  }
  // 将properties转换成数组，且按x-index排序
  const properties = Object.values(schema.properties || {}).sort((a: any, b: any) => {
    return a['x-index'] - b['x-index'];
  });
  for (let i = 0; i < properties.length; i++) {
    const property = properties[i];
    const result = findFirstVirtualSchema(property, uid);
    if (result) {
      let insertPosition = result.insertPosition;
      let insertTarget = result.insertTarget;
      if (!schema['x-virtual'] && property['x-virtual']) {
        if (i === properties.length - 1) {
          insertPosition = 'beforeEnd';
          insertTarget = schema['x-uid'];
        } else {
          insertPosition = 'beforeBegin';
          insertTarget = properties[i + 1]['x-uid'];
        }
      }
      return {
        schema: schema['x-virtual'] ? schema : result.schema,
        insertTarget,
        insertPosition,
      };
    }
  }

  return null;
}

/**
 * Convert a schema to a create schema format
 * @param schema The schema to convert
 * @returns The converted schema
 */
export function convertToCreateSchema(schema: any): any {
  const getNewSchema = (schema: any): any => {
    const newSchema = {
      type: schema.type,
      name: schema.name,
      'x-uid': schema['x-uid'],
      'x-template-uid': schema['x-template-uid'],
      'x-template-root-uid': schema['x-template-root-uid'],
    };
    if (schema.properties) {
      newSchema['properties'] = {};
      for (const key in schema.properties) {
        newSchema['properties'][key] = getNewSchema(schema.properties[key]);
      }
    }
    return newSchema;
  };
  const tmpSchema = new Schema(getNewSchema(schema));
  return tmpSchema.toJSON();
}

/**
 * Get the full schema by merging with template schema
 * @param schema The schema to process
 * @param templateschemacache The template schema cache
 * @returns The full schema
 */
export function getFullSchema(schema: any, templateschemacache: Record<string, any>): any {
  const rootId = schema['x-uid'];
  const templateRootId = schema['x-template-root-uid'];

  if (!templateRootId) {
    for (const key in schema.properties) {
      const property = schema.properties[key];
      schema.properties[key] = getFullSchema(property, templateschemacache);
      if (schema.properties[key]['x-component'] === undefined) {
        delete schema.properties[key]; // 说明已经从模板中删除了
      }
    }
    return schema;
  } else {
    const target = _.cloneDeep(templateschemacache[templateRootId]);
    const result = mergeSchema(target, schema, rootId, templateschemacache);
    return result;
  }
}

/**
 * Merge two schemas together
 * @param target The target schema
 * @param source The source schema
 * @param rootId The root UID
 * @param templateschemacache The template schema cache
 * @returns The merged schema
 */
export function mergeSchema(target: any, source: any, rootId: string, templateschemacache: Record<string, any>): any {
  return _.mergeWith(
    target,
    source,
    (objectValue: any, sourceValue: any, keyName: string, object: any, source: any) => {
      if (sourceValue == null) {
        return objectValue;
      }
      if (_.isObject(sourceValue)) {
        if (_.isArray(sourceValue)) {
          return sourceValue || objectValue;
        }

        // properties 存在 x-index 冲突的情况
        if (keyName === 'properties') {
          const targetKeys = Object.keys(objectValue || {});
          const sourceKeys = Object.keys(sourceValue);
          const keys = _.union(targetKeys, sourceKeys);
          const removedKeys = source['x-removed-properties'] || [];
          // 找出存在于targetKeys但不能存在于sourceKeys的key， 说明是新增的字段
          const newKeys = _.difference(targetKeys, sourceKeys);
          if (newKeys.length > 0) {
            const newProperties = _.cloneDeep(_.pick(objectValue, newKeys));
            const newSchemas = [];
            for (const key of newKeys) {
              const newSchema = convertTplBlock(newProperties[key], true, false, rootId);
              newSchema['name'] = key;
              newSchemas.push(newSchema);
              source['properties'][key] = newSchema;
            }
          }
          const properties = {};
          for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            if (removedKeys.includes(k)) {
              continue;
            }
            const sourceProperty = sourceValue?.[k] || {};
            if (_.get(objectValue, [k, 'properties'])) {
              sourceProperty['properties'] = sourceProperty['properties'] || {};
            }
            properties[k] = mergeSchema(objectValue?.[k] || {}, sourceValue?.[k], rootId, templateschemacache);
            if (properties[k]['x-template-root-uid']) {
              properties[k] = getFullSchema(properties[k], templateschemacache);
            }
          }
          const parentIndexs = [];
          // x-index 冲突则取最大值+1
          for (const key in properties) {
            if (properties[key]['x-index']) {
              const xIndex = properties[key]['x-index'];
              if (parentIndexs.includes(xIndex)) {
                properties[key]['x-index'] = Math.max(...parentIndexs) + 1;
              }
              parentIndexs.push(properties[key]['x-index']);
            }
          }
          return properties;
        }

        return mergeSchema(objectValue || {}, sourceValue, rootId, templateschemacache);
      }
      return sourceValue;
    },
  );
}
