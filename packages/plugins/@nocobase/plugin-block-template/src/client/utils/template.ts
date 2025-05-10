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

export function findSchemaByUid(schema: Schema, uid: string) {
  if (!schema) {
    return null;
  }
  if (schema['x-uid'] === uid) {
    return schema;
  }
  if (schema.properties) {
    for (const key in schema.properties) {
      const result = findSchemaByUid(schema.properties[key], uid);
      if (result) {
        return result;
      }
    }
  }
  return null;
}

export function collectSchemaFirstVirtualUids(schema: Schema) {
  const uids = new Set<string>();
  const collectUids = (schema: Schema) => {
    if (!schema) {
      return;
    }
    if (schema['x-virtual']) {
      uids.add(schema['x-uid']);
      return;
    }
    if (schema.properties) {
      for (const key in schema.properties) {
        collectUids(schema.properties[key]);
      }
    }
  };
  collectUids(schema);
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
 * Find the first virtual schema by UID
 * @param schema The schema to search in
 * @param uid The UID to search for
 * @returns Object containing schema and insertion details, or null if not found
 */
export function findFirstVirtualSchema(
  schema: ISchema,
  uid: string,
  wrap?: ISchema,
): { schema: any; insertTarget: string; insertPosition: string } | null {
  // Helper function to find next non-virtual node
  const findNextNonVirtualNode = (properties: any[], startIndex: number) => {
    for (let i = startIndex + 1; i < properties.length; i++) {
      if (!properties[i]['x-virtual'] && properties[i]['x-uid'] !== wrap?.['x-uid']) {
        return properties[i]['x-uid'];
      }
    }
    return null;
  };

  if (!schema) {
    return null;
  }
  if (schema['x-uid'] === uid && schema['x-virtual']) {
    return {
      schema,
      insertTarget: null,
      insertPosition: 'afterBegin',
    };
  }
  // Convert properties to array and sort by x-index
  const properties = Object.values(schema.properties || {}).sort((a: any, b: any) => {
    return a['x-index'] - b['x-index'];
  });
  for (let i = 0; i < properties.length; i++) {
    const property = properties[i];
    const result = findFirstVirtualSchema(property, uid, wrap);
    if (result) {
      let insertPosition = result.insertPosition;
      let insertTarget = result.insertTarget;
      if (!schema['x-virtual'] && property['x-virtual']) {
        const nextNonVirtualNode = findNextNonVirtualNode(properties, i);
        if (!nextNonVirtualNode) {
          insertPosition = 'beforeEnd';
          insertTarget = schema['x-uid'];
        } else {
          insertPosition = 'beforeBegin';
          insertTarget = nextNonVirtualNode;
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
export function convertToCreateSchema(schema: ISchema, skipUids: string[] = []): any {
  const getNewSchema = (schema: ISchema): ISchema => {
    if (skipUids.includes(schema['x-uid'])) {
      return null;
    }
    let newSchema: ISchema = {
      type: schema.type,
      name: schema.name,
      'x-uid': schema['x-uid'],
      'x-template-uid': schema['x-template-uid'],
      'x-template-root-uid': schema['x-template-root-uid'],
    };
    if (!schema['x-template-uid']) {
      newSchema = { ..._.omit(schema, ['properties']) };
    }
    delete newSchema['x-virtual'];

    if (schema.properties) {
      newSchema['properties'] = {};
      for (const key in schema.properties) {
        const newProperty = getNewSchema(schema.properties[key]);
        if (newProperty) {
          newSchema['properties'][key] = newProperty;
        }
      }
    }
    return newSchema;
  };
  const tmpSchema = new Schema(getNewSchema(schema));
  return tmpSchema.toJSON();
}

function shouldDeleteNoComponentSchema(schema: ISchema) {
  if (!schema['x-no-component']) {
    return true;
  }
  const properties = schema?.properties;
  return properties && Object.values(properties).some((s) => s['x-component'] == null);
}

function cleanSchema(schema?: any) {
  const properties = schema?.properties || {};
  for (const key of Object.keys(properties)) {
    // 如果x-component是undefined/null
    if (schema.properties[key]['x-component'] == null && shouldDeleteNoComponentSchema(schema.properties[key])) {
      delete schema.properties[key];
    }
    if (properties[key]?.['x-component-props'] === null) {
      delete properties[key]['x-component-props'];
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
    cleanSchema(properties[key]);
  }
}

export function addToolbarClass(schema) {
  if ((schema['x-toolbar'] || schema['x-designer']) && schema['x-template-uid']) {
    const className = `${schema['x-toolbar-props']?.toolbarClassName || ''}`;
    _.merge(schema, {
      'x-toolbar-props': {
        toolbarClassName: `${className.includes('nb-in-template') ? className : `${className} nb-in-template`}`,
      },
    });
  }
  if (schema.properties) {
    for (const key in schema.properties) {
      addToolbarClass(schema.properties[key]);
    }
  }
}

export function syncExtraTemplateInfo(schema: any, templateInfos: Map<string, any>, savedSchemaUids: Set<string>) {
  if (schema['x-block-template-key']) {
    schema['x-template-title'] = templateInfos.get(schema['x-block-template-key'])?.title;
  }
  if (savedSchemaUids.has(schema['x-uid'])) {
    delete schema['x-virtual'];
    savedSchemaUids.delete(schema['x-uid']);
  }
  if (schema.properties) {
    for (const key in schema.properties) {
      syncExtraTemplateInfo(schema.properties[key], templateInfos, savedSchemaUids);
    }
  }
}

const NestedGridComponents = ['Grid', 'Grid.Row', 'Grid.Col'];
type GridItemInfo = {
  schema: ISchema;
  path: Array<{ schema: ISchema; type: string; key: string }>;
  key: string;
};
/**
 * Collects all grid items from a schema's properties recursively
 * @param schema The schema to collect items from
 * @param itemsMap Map to store collected items with their paths
 * @param parentPath Array of parent grid components
 * @param schemaKey Current schema's key in its parent
 */
function collectGridItems(
  schema: ISchema,
  itemsMap: Map<string, GridItemInfo>,
  parentPath: Array<{ schema: ISchema; type: string; key: string }> = [],
  schemaKey?: string,
) {
  const properties = schema.properties || {};
  const component = schema['x-component'];

  // If current schema is a grid component, add it to the path
  if (NestedGridComponents.includes(component)) {
    parentPath = [
      ...parentPath,
      {
        schema,
        type: component,
        key: schemaKey || '',
      },
    ];
  }

  for (const [key, property] of Object.entries(properties)) {
    if (!property) continue;

    const propertyComponent = property['x-component'];

    if (NestedGridComponents.includes(propertyComponent)) {
      // Recursively collect items from nested grid structures
      collectGridItems(property, itemsMap, parentPath, key);
    } else if (property['x-uid']) {
      // Store non-grid items with their full path context and key
      itemsMap.set(property['x-uid'], {
        schema: property,
        path: parentPath,
        key,
      });
    }
  }
}

function getNewObjectValue(itemsMap: Map<string, GridItemInfo>) {
  const remainingTemplateItems: ISchema = { properties: {} };
  for (const [_uid, item] of itemsMap.entries()) {
    let current = remainingTemplateItems;
    for (const pathItem of item.path.slice(1)) {
      if (!current.properties) {
        current.properties = {};
      }
      if (!current.properties[pathItem.key]) {
        current.properties[pathItem.key] = {
          ...pathItem.schema,
          properties: {},
        };
      }
      current = current.properties[pathItem.key];
    }
    current.properties = current.properties || {};
    current.properties[item.key] = item.schema;
  }
  return remainingTemplateItems.properties;
}

/**
 * Get the full schema by merging with template schema
 * @param schema The schema to process
 * @param templateschemacache The template schema cache
 * @param templateInfos The template info cache
 * @returns The full schema
 */
export function getFullSchema(
  schema: any,
  templateschemacache: Record<string, any>,
  templateInfos: Map<string, any>,
  savedSchemaUids: Set<string> = new Set(),
): any {
  const rootId = schema['x-uid'];
  const templateRootId = schema['x-template-root-uid'];
  const templateKey = schema['x-block-template-key'];
  let ret = schema;

  if (!templateRootId) {
    for (const key in schema.properties) {
      const property = schema.properties[key];
      schema.properties[key] = getFullSchema(property, templateschemacache, templateInfos, savedSchemaUids);
      if (schema.properties[key]['x-component'] == null) {
        delete schema.properties[key]; // 说明已经从模板中删除了
      }
    }
  } else {
    const target = _.cloneDeep(templateschemacache[templateRootId]);
    const result = mergeSchema(target || {}, schema, rootId, templateschemacache, templateInfos, templateKey);
    ret = result;
  }
  addToolbarClass(ret);
  syncExtraTemplateInfo(ret, templateInfos, savedSchemaUids);
  cleanSchema(ret);
  return ret;
}

/**
 * Merge two schemas together
 * @param target The target schema
 * @param source The source schema
 * @param rootId The root UID
 * @param templateschemacache The template schema cache
 * @param templateInfos The template info cache
 * @returns The merged schema
 */
function mergeSchema(
  target: any,
  source: any,
  rootId: string,
  templateschemacache: Record<string, any>,
  templateInfos: Map<string, any>,
  templateKey?: string,
): any {
  if (target['properties'] && !source['properties']) {
    source['properties'] = {};
  }

  return _.mergeWith(
    target,
    source,
    (objectValue: any, sourceValue: any, keyName: string, object: any, source: any) => {
      if (sourceValue == null) {
        return objectValue;
      }
      if (keyName === 'default' && object['x-settings'] === 'actionSettings:filter') {
        return sourceValue || objectValue;
      }

      if (_.isObject(sourceValue)) {
        if (_.isArray(sourceValue)) {
          return sourceValue || objectValue;
        }

        if (keyName === 'properties') {
          const sourceKeys = Object.keys(sourceValue);
          let targetKeys = Object.keys(objectValue || {});

          // 处理Grid的拖动后行列改变的情况
          if (
            NestedGridComponents.includes(source['x-component']) &&
            NestedGridComponents.includes(object['x-component'])
          ) {
            const tItemsMap = new Map<string, GridItemInfo>();
            const sItemsMap = new Map<string, GridItemInfo>();

            // Collect items from both template and source
            collectGridItems(object, tItemsMap);
            collectGridItems(source, sItemsMap);

            // Match and merge items based on template UIDs
            for (const [uid, sourceItem] of sItemsMap.entries()) {
              if (!sourceItem.schema['x-template-uid']) continue;

              const templateItem = tItemsMap.get(sourceItem.schema['x-template-uid']);
              if (templateItem) {
                // Merge the schemas
                const mergedSchema = mergeSchema(
                  templateItem.schema || {},
                  sourceItem.schema,
                  sourceItem.schema['x-template-root-uid'] || rootId,
                  templateschemacache,
                  templateInfos,
                  templateKey,
                );

                sourceItem.path[sourceItem.path.length - 1].schema.properties[sourceItem.key] = mergedSchema;
                sourceItem.schema = mergedSchema;

                // Remove matched item from template map
                tItemsMap.delete(sourceItem.schema['x-template-uid']);
              }
            }

            objectValue = getNewObjectValue(tItemsMap);
            object['properties'] = objectValue;
            targetKeys = Object.keys(objectValue);
          }

          // merge some popups
          if (object['x-component'] === 'CollectionField') {
            for (const skey of sourceKeys) {
              const assFieldCom = sourceValue[skey]?.['x-component'];
              if (
                [
                  'Action.Container',
                  'AssociationField.Viewer',
                  'AssociationField.Selector',
                  'AssociationField.Nester',
                  'AssociationField.SubTable',
                ].includes(assFieldCom)
              ) {
                const tkey = targetKeys.find((k) => objectValue[k]['x-component'] === assFieldCom);
                if (tkey) {
                  sourceValue[skey]['x-template-uid'] = objectValue[tkey]['x-uid'];
                  sourceValue[skey] = mergeSchema(
                    objectValue[tkey] || {},
                    sourceValue[skey],
                    rootId,
                    templateschemacache,
                    templateInfos,
                    templateKey,
                  );
                  targetKeys = targetKeys.filter((k) => k !== tkey);
                }
              }
            }
          }

          // remove duplicate configureActions keys and configureFields keys
          if (/:configure.*Actions/.test(object['x-initializer'])) {
            // "x-settings": "actionSettings:bulkDelete"
            // "x-settings": "actionSettings:filter"
            // "x-settings": "actionSettings:refresh"
            // "x-settings": "actionSettings:delete"
            // "x-settings": "actionSettings:print"
            // "x-settings": "actionSettings:disassociate"
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
                    sourceValue[skey]['x-template-uid'] = objectValue[removedTargetKeys[0]]['x-uid'];
                  }
                }
              }

              if (sourceValue[skey]?.['x-component'] && sourceValue[skey]?.['x-settings']?.includes('actionSettings')) {
                const actionName = sourceValue[skey]['x-settings'].split(':')[1];
                const targetActionName = [
                  'bulkDelete',
                  'filter',
                  'refresh',
                  'delete',
                  'print',
                  'stepsFormNext',
                  'stepsFormPrevious',
                  'disassociate',
                  'MailSend',
                  'MailRefresh',
                  'MailAccountSetting',
                  'MailMarkAsRead',
                  'MailMarkAsUnRead',
                ].find((name) => name === actionName);
                if (targetActionName) {
                  const removedTargetKeys = _.remove(
                    targetKeys,
                    (key) => objectValue[key]?.['x-settings'] === `actionSettings:${targetActionName}`,
                  );
                  if (removedTargetKeys.length > 0) {
                    sourceValue[skey]['x-template-uid'] = objectValue[removedTargetKeys[0]]['x-uid'];
                  }
                }
              }
            }
          }

          // 可重复的fields情况有以下几种
          // table:configureColumns
          for (const skey of sourceKeys) {
            if (object['x-initializer']?.includes(':configureColumns')) {
              if (sourceValue[skey]['x-component'] && sourceValue[skey]['x-settings'] === 'fieldSettings:TableColumn') {
                const sourceColFieldSchema = Object.values(sourceValue[skey]?.['properties'] || {})[0];
                const xColField = _.get(sourceColFieldSchema, 'x-collection-field');
                if (xColField) {
                  let targetColFieldSchema = null;
                  const removedTargetKeys = _.remove(targetKeys, (key) => {
                    targetColFieldSchema = Object.values(objectValue[key]?.['properties'] || {})[0];
                    const targetColField = _.get(targetColFieldSchema, 'x-collection-field');
                    return xColField === targetColField;
                  });
                  if (removedTargetKeys.length > 0) {
                    sourceValue[skey]['x-template-uid'] = objectValue[removedTargetKeys[0]]['x-uid'];
                    sourceColFieldSchema['x-template-uid'] = targetColFieldSchema?.['x-uid'];
                  }
                }
              }
              // find the x-initializer: "table:configureItemActions"
              if (sourceValue[skey]['x-initializer']?.includes(':configureItemActions')) {
                const removedTargetKeys = _.remove(targetKeys, (key) => {
                  return objectValue[key]?.['x-initializer']?.includes(':configureItemActions');
                });
                if (removedTargetKeys.length > 0) {
                  sourceValue[skey]['x-template-uid'] = objectValue[removedTargetKeys[0]]['x-uid'];
                }
              }
            }
          }

          // 还有些fields情况
          // *:configureFields
          if (/:configureFields/.test(source['x-initializer'])) {
            const targetFieldsMap = new Map<string, GridItemInfo>();
            collectGridItems(object, targetFieldsMap);
            const targetFields = Array.from(targetFieldsMap.values());

            for (const skey of sourceKeys) {
              const sourceFieldsMap = new Map<string, GridItemInfo>();
              collectGridItems(sourceValue[skey], sourceFieldsMap);

              for (const [uid, sourceItem] of sourceFieldsMap.entries()) {
                const xColField = _.get(sourceItem.schema, 'x-collection-field');
                if (!xColField) continue;
                // find the target fields with the same x-collection-field
                const targetItem = _.find(targetFields, (field) => field.schema['x-collection-field'] === xColField);
                if (targetItem) {
                  targetFieldsMap.delete(targetItem.schema['x-uid']);
                  sourceItem.schema['x-template-uid'] = targetItem.schema['x-uid'];
                  sourceItem.schema = mergeSchema(
                    targetItem.schema || {},
                    sourceItem.schema,
                    sourceItem.schema['x-template-root-uid'] || rootId,
                    templateschemacache,
                    templateInfos,
                    templateKey,
                  );
                }
              }
              // 剩余的fields
              objectValue = getNewObjectValue(targetFieldsMap);
              object['properties'] = objectValue;
              targetKeys = Object.keys(objectValue);
            }
          }

          if (target['x-decorator'] === 'DndContext') {
            for (const skey of sourceKeys) {
              const actionSettings = sourceValue[skey]['x-settings'];
              if (
                sourceValue[skey]['x-component'] &&
                ['actionSettings:disassociate', 'actionSettings:delete'].includes(actionSettings)
              ) {
                const removedTargetKeys = _.remove(targetKeys, (key) => {
                  return objectValue[key]?.['x-settings'] === actionSettings;
                });
                if (removedTargetKeys.length > 0) {
                  sourceValue[skey]['x-template-uid'] = objectValue[removedTargetKeys[0]]['x-uid'];
                }
              }
            }
          }

          // Find keys that exist in targetKeys but not in sourceKeys, indicating new fields
          const newKeys = _.difference(targetKeys, sourceKeys);
          if (newKeys.length > 0) {
            const newProperties = _.cloneDeep(_.pick(objectValue, newKeys));
            for (const key of newKeys) {
              const newSchema = convertTplBlock(newProperties[key], true, false, rootId, templateKey);
              const newUid = newSchema['x-uid'];
              const sourceKey = _.findKey(sourceValue, (value) => value['x-uid'] === newUid);
              if (sourceKey) {
                sourceValue[sourceKey] = mergeSchema(
                  newProperties[key] || {},
                  sourceValue[sourceKey],
                  rootId,
                  templateschemacache,
                  templateInfos,
                  templateKey,
                );
              } else {
                newSchema['name'] = key;
                sourceValue[key] = newSchema;
              }
            }
          }
          const properties = {};

          const keys = Object.keys(sourceValue);
          for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            // const sourceProperty = sourceValue?.[k] || {};
            // if (_.get(objectValue, [k, 'properties'])) {
            //   sourceProperty['properties'] = sourceProperty['properties'] || {};
            // }
            properties[k] = mergeSchema(
              objectValue?.[k] || {},
              sourceValue?.[k],
              rootId,
              templateschemacache,
              templateInfos,
              templateKey,
            );
            if (properties[k]['x-template-root-uid']) {
              properties[k] = getFullSchema(properties[k], templateschemacache, templateInfos);
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

          return properties;
        }

        return mergeSchema(objectValue || {}, sourceValue, rootId, templateschemacache, templateInfos, templateKey);
      }
      return sourceValue;
    },
  );
}

/**
 * Set x-virtual to false for all virtual schemas
 * @param schema The schema to set
 */
export function setToTrueSchema(schema: any) {
  if (schema['x-virtual']) {
    delete schema['x-virtual'];
  }
  if (schema.properties) {
    for (const key in schema.properties) {
      setToTrueSchema(schema.properties[key]);
    }
  }
}
