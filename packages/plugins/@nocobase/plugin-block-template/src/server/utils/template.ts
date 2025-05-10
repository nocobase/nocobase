/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, Transaction } from '@nocobase/database';
import { UiSchemaRepository } from '@nocobase/plugin-ui-schema-storage';
import { Schema, uid } from '@nocobase/utils';
import _ from 'lodash';

export async function getNewFullBlock(db: Database, transaction: Transaction, blockUid: string) {
  const repository = db.getRepository<UiSchemaRepository>('uiSchemas');
  const block = await repository.getJsonSchema(blockUid, {
    includeAsyncNode: true,
    readFromCache: true,
    transaction,
  });
  const templateId = block['x-template-root-uid'];
  if (!templateId) {
    return block;
  }
  const template = await repository.getJsonSchema(templateId, {
    includeAsyncNode: true,
    readFromCache: true,
    transaction,
  });
  // 将 template 的 schema 合并到 block 中
  const newSchema = mergeSchema(template, block, _.cloneDeep(template));
  cleanSchema(newSchema, templateId);
  return newSchema;
}

function getNewObjectValue(itemsMap: Map<string, GridItemInfo>) {
  const remainingTemplateItems = { properties: {} } as Schema;
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

const NestedGridComponents = ['Grid', 'Grid.Row', 'Grid.Col'];
type GridItemInfo = {
  schema: Schema;
  path: Array<{ schema: Schema; type: string; key: string }>;
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
  schema: Schema,
  itemsMap: Map<string, GridItemInfo>,
  parentPath: Array<{ schema: Schema; type: string; key: string }> = [],
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

export function mergeSchema(template, schema, rootTemplate) {
  if (template['properties'] && !schema['properties']) {
    schema['properties'] = {};
  }

  return _.mergeWith(
    template,
    schema,
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
                const mergedSchema = mergeSchema(templateItem.schema || {}, sourceItem.schema, rootTemplate);

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
                  sourceValue[skey] = mergeSchema(objectValue[tkey] || {}, sourceValue[skey], rootTemplate);
                  targetKeys = targetKeys.filter((k) => k !== tkey);
                }
              }
            }
          }

          // remove duplicate configureActions keys and configureFields keys
          if (/:configure.*Actions/.test(object['x-initializer'])) {
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
                  sourceItem.schema = mergeSchema(targetItem.schema || {}, sourceItem.schema, rootTemplate);
                }
              }
              // 剩余的fields
              objectValue = getNewObjectValue(targetFieldsMap);
              object['properties'] = objectValue;
              targetKeys = Object.keys(objectValue);
            }
          }

          if (object['x-decorator'] === 'DndContext') {
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

          const keys = _.union(targetKeys, sourceKeys);

          // Find keys that exist in targetKeys but not in sourceKeys, indicating new fields
          const newKeys = _.difference(targetKeys, sourceKeys);
          if (newKeys.length > 0) {
            const newProperties = _.cloneDeep(_.pick(objectValue, newKeys));
            const newSchemas = [];
            for (const key of newKeys) {
              const newSchema = convertTplBlock(newProperties[key]);
              newSchema['name'] = key;
              newSchemas.push(newSchema);
              source['properties'][key] = newSchema;
            }
          }
          const properties = {};
          for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            const sourceProperty = sourceValue?.[k] || {};
            if (_.get(objectValue, [k, 'properties'])) {
              sourceProperty['properties'] = sourceProperty['properties'] || {};
            }
            properties[k] = mergeSchema(objectValue?.[k] || {}, sourceValue?.[k], rootTemplate);

            if (
              properties[k]['x-template-root-uid'] &&
              properties[k]['x-template-root-uid'] === rootTemplate['x-uid']
            ) {
              properties[k] = mergeSchema(_.cloneDeep(rootTemplate), properties[k], rootTemplate);
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

        return mergeSchema(objectValue || {}, sourceValue || {}, rootTemplate);
      }
      return sourceValue;
    },
  );
}

function shouldDeleteNoComponentSchema(schema: Schema) {
  if (!schema['x-no-component']) {
    return true;
  }
  const properties = schema?.properties;
  return properties && Object.values(properties).some((s) => s['x-component'] == null);
}

export function cleanSchema(schema?: Schema, templateId?: string) {
  const properties = schema?.properties || {};
  if (schema) {
    delete schema['x-template-root-uid'];
    delete schema['x-template-uid'];
    delete schema['x-block-template-key'];
    delete schema['x-virtual'];
    delete schema['x-template-version'];
  }
  for (const key of Object.keys(properties)) {
    if (
      schema.properties[key]['x-component'] == null &&
      !schema.properties[key]['x-template-root-uid'] &&
      shouldDeleteNoComponentSchema(schema.properties[key])
    ) {
      delete schema.properties[key];
      continue;
    }
    if (schema.properties[key]['x-template-root-uid'] && schema.properties[key]['x-template-root-uid'] !== templateId) {
      continue;
    }
    if (properties[key]?.['x-component-props'] === null) {
      delete properties[key]['x-component-props'];
    }
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
    cleanSchema(properties[key], templateId);
  }
}

function convertTplBlock(tpl) {
  const newSchema = _.cloneDeep(tpl);
  const regeneratedUid = (schema) => {
    if (schema['x-uid']) {
      schema['x-uid'] = uid();
    }
    if (schema['properties']) {
      for (const key in schema['properties']) {
        regeneratedUid(schema['properties'][key]);
      }
    }
  };
  regeneratedUid(newSchema);
  return newSchema;
}
