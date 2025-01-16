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

function syncUniqueFieldTemplateInfo(sourceValue: any, skey: string, removedTargetKeys: string[], objectValue: any) {
  if (removedTargetKeys.length > 0) {
    sourceValue[skey]['x-template-uid'] = objectValue[removedTargetKeys[0]]['x-uid'];
    const sourceSchema = sourceValue[skey];
    const removedSchema = objectValue[removedTargetKeys[0]];
    _.mergeWith(sourceSchema, removedSchema, function mergeTemplateUid(sSchema, rSchema, key) {
      if (key === 'properties' && sSchema) {
        const sKeys = Object.keys(sSchema || {});
        const rKeys = Object.keys(rSchema || {});
        sKeys.forEach((skey, keyIndex) => {
          if (sSchema[skey]['x-component'] === 'Grid.Row' || sSchema[skey]['x-component'] === 'Grid.Col') {
            mergeTemplateUid(sSchema[skey]?.['properties'], rSchema[rKeys[keyIndex]]?.['properties'], 'properties');
          } else {
            sSchema[skey]['x-template-uid'] = rSchema?.[rKeys[keyIndex]]?.['x-uid'];
            mergeTemplateUid(sSchema[skey]?.['properties'], rSchema?.[rKeys[keyIndex]]?.['properties'], 'properties');
          }
        });
      }
      return sSchema;
    });
  }
}

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

function mergeSchema(template, schema, rootTemplate) {
  return _.mergeWith(
    template,
    schema,
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
          let targetKeys = Object.keys(objectValue || {});
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
                  syncUniqueFieldTemplateInfo(sourceValue, skey, removedTargetKeys, objectValue);
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
                  syncUniqueFieldTemplateInfo(sourceValue, skey, removedTargetKeys, objectValue);
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
                  syncUniqueFieldTemplateInfo(sourceValue, skey, removedTargetKeys, objectValue);
                }
              }
              // find the x-initializer: "table:configureItemActions"
              if (sourceValue[skey]['x-initializer'] === 'table:configureItemActions') {
                const removedTargetKeys = _.remove(targetKeys, (key) => {
                  return objectValue[key]?.['x-initializer'] === 'table:configureItemActions';
                });
                syncUniqueFieldTemplateInfo(sourceValue, skey, removedTargetKeys, objectValue);
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
              syncUniqueFieldTemplateInfo(sourceValue, skey, removedTargetKeys, objectValue);
            }
          }

          // 处理Grid的拖动后行列改变的情况
          if (source['x-component'] === 'Grid' && object['x-component'] === 'Grid') {
            const tItemsMap = new Map();

            for (const [rowKey, row] of Object.entries(object['properties'] || {})) {
              for (const [colKey, col] of Object.entries(row['properties'] || {})) {
                for (const [itemKey, item] of Object.entries(col['properties'] || {})) {
                  if (item['x-uid']) {
                    tItemsMap.set(item['x-uid'], { schema: item, row, col, rowKey, colKey, itemKey });
                  }
                }
              }
            }

            for (const row of Object.values(source['properties'] || {})) {
              for (const col of Object.values(row['properties'] || {})) {
                for (const [schemaKey, schema] of Object.entries(col['properties'] || {})) {
                  if (schema['x-template-uid']) {
                    const matchedItem = tItemsMap.get(schema['x-template-uid']);
                    if (matchedItem) {
                      col['properties'][schemaKey] = mergeSchema(matchedItem.schema || {}, schema || {}, rootTemplate);
                      tItemsMap.delete(schema['x-template-uid']);
                    }
                  }
                }
              }
            }

            const targetProperties = {};
            for (const [itemId, item] of tItemsMap) {
              targetProperties[item.rowKey] = targetProperties[item.rowKey] || {
                ...item.row,
                properties: {},
              };
              targetProperties[item.rowKey]['properties'][item.colKey] = targetProperties[item.rowKey]['properties'][
                item.colKey
              ] || {
                ...item.col,
                properties: {},
              };
              targetProperties[item.rowKey]['properties'][item.colKey]['properties'][item.itemKey] = item.schema;
            }
            targetKeys = Object.keys(targetProperties);
            objectValue = targetProperties;
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

function cleanSchema(schema?: Schema, templateId?: string) {
  const properties = schema?.properties || {};
  if (schema) {
    delete schema['x-template-root-uid'];
    delete schema['x-template-uid'];
    delete schema['x-block-template-key'];
    delete schema['x-virtual'];
    delete schema['x-template-version'];
  }
  for (const key of Object.keys(properties)) {
    if (schema.properties[key]['x-component'] === undefined && !schema.properties[key]['x-template-root-uid']) {
      delete schema.properties[key];
      continue;
    }
    if (schema.properties[key]['x-template-root-uid'] && schema.properties[key]['x-template-root-uid'] !== templateId) {
      continue;
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
