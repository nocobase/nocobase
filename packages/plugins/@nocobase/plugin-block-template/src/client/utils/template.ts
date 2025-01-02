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
  // Convert properties to array and sort by x-index
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

        if (keyName === 'properties') {
          const sourceKeys = Object.keys(sourceValue);
          const targetKeys = Object.keys(objectValue || {});
          // remove duplicate configureActions keys and configureFields keys
          if (/:configure.*Actions/.test(object['x-initializer'])) {
            // "x-settings": "actionSettings:bulkDelete"
            // "x-settings": "actionSettings:filter"
            // "x-settings": "actionSettings:refresh"
            // "x-settings": "actionSettings:delete"
            // "x-settings": "actionSettings:print"
            // filterForm:configureActions && x-use-component-props: useFilterBlockActionProps
            // filterForm:configureActions && x-use-component-props: useResetBlockActionProps
            // actionSettings:stepsFormNext
            // actionSettings:stepsFormPrevious
            for (const skey of sourceKeys) {
              if (object['x-initializer'] === 'filterForm:configureActions') {
                const sourceUseComponentProps = sourceValue[skey]?.['x-use-component-props'];
                if (
                  sourceUseComponentProps &&
                  ['useFilterBlockActionProps', 'useResetBlockActionProps'].includes(sourceUseComponentProps)
                ) {
                  const removedTargetKeys = _.remove(targetKeys, (key) => {
                    const targetUseComponentProps = objectValue[key]?.['x-use-component-props'];
                    return sourceUseComponentProps === targetUseComponentProps;
                  });
                  if (removedTargetKeys.length > 0) {
                    sourceValue[skey]['x-removed-target-key'] = removedTargetKeys[0];
                  }
                }
              }

              if (sourceValue[skey]?.['x-settings']?.includes('actionSettings')) {
                const actionName = sourceValue[skey]['x-settings'].split(':')[1];
                const targetActionName = [
                  'bulkDelete',
                  'filter',
                  'refresh',
                  'delete',
                  'print',
                  'stepsFormNext',
                  'stepsFormPrevious',
                ].find((name) => name === actionName);
                if (targetActionName) {
                  const removedTargetKeys = _.remove(
                    targetKeys,
                    (key) => objectValue[key]?.['x-settings'] === `actionSettings:${targetActionName}`,
                  );
                  if (removedTargetKeys.length > 0) {
                    sourceValue[skey]['x-removed-target-key'] = removedTargetKeys[0];
                  }
                }
              }
            }
          }

          // 可重复的fields情况有以下几种
          // table:configureColumns
          for (const skey of sourceKeys) {
            if (object['x-initializer'] === 'table:configureColumns') {
              if (sourceValue[skey]['x-settings'] === 'fieldSettings:TableColumn') {
                const xColField = _.get(
                  Object.values(sourceValue[skey]?.['properties'] || {})[0],
                  'x-collection-field',
                );
                if (xColField) {
                  const removedTargetKeys = _.remove(targetKeys, (key) => {
                    const targetColField = _.get(
                      Object.values(objectValue[key]?.['properties'] || {})[0],
                      'x-collection-field',
                    );
                    return xColField === targetColField;
                  });
                  if (removedTargetKeys.length > 0) {
                    sourceValue[skey]['x-removed-target-key'] = removedTargetKeys[0];
                  }
                }
              }
              // find the x-initializer: "table:configureItemActions"
              if (sourceValue[skey]['x-initializer'] === 'table:configureItemActions') {
                const removedTargetKeys = _.remove(targetKeys, (key) => {
                  return objectValue[key]?.['x-initializer'] === 'table:configureItemActions';
                });
                if (removedTargetKeys.length > 0) {
                  sourceValue[skey]['x-removed-target-key'] = removedTargetKeys[0];
                }
              }
            }
          }

          // 还有些fields情况
          // *:configureFields
          for (const skey of sourceKeys) {
            if (/:configureFields/.test(source['x-initializer'])) {
              const xColFields = collectCollectionFields(sourceValue[skey]?.['properties'] || {});
              const removedTargetKeys = _.remove(targetKeys, (key) => {
                const targetXColFields = collectCollectionFields(objectValue[key]?.['properties'] || {});
                return !!_.find(xColFields, (field) => targetXColFields.includes(field));
              });
              if (removedTargetKeys.length > 0) {
                sourceValue[skey]['x-removed-target-key'] = removedTargetKeys[0];
              }
            }
          }

          const keys = _.union(targetKeys, sourceKeys);
          const removedKeys = source['x-removed-properties'] || [];
          // Find keys that exist in targetKeys but not in sourceKeys, indicating new fields
          const newKeys = _.difference(targetKeys, sourceKeys);
          if (newKeys.length > 0) {
            const newProperties = _.cloneDeep(_.pick(objectValue, newKeys));
            const newSchemas = [];
            for (const key of newKeys) {
              const newSchema = convertTplBlock(
                newProperties[key],
                true,
                false,
                rootId,
                _.get(source, 'x-template-title'),
              );
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

          // Handle x-index conflicts in properties
          const parentIndexs = [];
          // If x-index conflicts, use max value + 1
          for (const key in properties) {
            if (properties[key]['x-index']) {
              const xIndex = properties[key]['x-index'];
              if (parentIndexs.includes(xIndex)) {
                properties[key]['x-index'] = Math.max(...parentIndexs) + 1;
              }
              parentIndexs.push(properties[key]['x-index']);
            }
          }
          for (const key in properties) {
            const property = properties[key];
            if (property['x-component'] === undefined) {
              delete properties[key]; // 说明已经从模板中删除了
            }
            // 如果x-component是Grid.Row，且内部无任何内容，则删除
            if (properties[key]?.['x-component'] === 'Grid.Row') {
              let hasProperties = false;
              const cols = Object.values(properties[key]?.['properties'] || {});
              for (const col of cols) {
                if (col['x-component'] === 'Grid.Col') {
                  if (!_.isEmpty(col['properties'])) {
                    hasProperties = true;
                  }
                }
              }
              if (!hasProperties) {
                delete properties[key];
              }
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

/**
 * Collects all collection fields from a property and its nested properties
 * @param properties The properties object to collect fields from
 * @returns Array of collection field names
 */
function collectCollectionFields(properties: Record<string, any>): string[] {
  return _.reduce(
    Object.values(properties || {}),
    (result: string[], property) => {
      const xColField = _.get(property, 'x-collection-field');
      if (xColField) {
        result.push(xColField);
      } else if (property['properties']) {
        result.push(...collectCollectionFields(property['properties']));
      }
      return result;
    },
    [],
  );
}
