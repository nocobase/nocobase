/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  APIClient,
  APIClientProvider,
  SchemaComponent,
  useAPIClient,
  useApp,
  usePlugin,
  useSchemaSettings,
} from '@nocobase/client';
import React, { useMemo } from 'react';
import { Schema, useFieldSchema, observer } from '@formily/react';
import * as _ from 'lodash';
import PluginBlocksTemplateClient from '..';

// const mergeSchema = (target, source, api) => {
//   // TODO: x-index 冲突算法
//   // TODO: 模板新增字段， 此时其实能知道新增的字段，可以在合并时记录并更新当前的区块
//   // TODO: 区块自己删除了，此时需要记录删除的字段，然后在合并时删除，比如增加一个'x-remove-properties'字段

//   return _.mergeWith(target, source, (objectValue, sourceValue, keyName, object, source) => {
//     if (sourceValue == null) {
//       return objectValue;
//     }
//     if (_.isObject(sourceValue)) {
//       if (_.isArray(sourceValue)) {
//         return _.union(objectValue || [], sourceValue);
//       }

//       // properties 存在 x-index 冲突的情况
//       if (keyName === 'properties') {
//         const targetKeys = Object.keys(objectValue || {});
//         const sourceKeys = Object.keys(sourceValue);
//         const keys = _.union(targetKeys, sourceKeys);
//         const removedKeys = source['x-removed-properties'] || [];
//         // 找出存在于targetKeys但不能存在于sourceKeys的key， 说明是新增的字段
//         const newKeys = _.difference(targetKeys, sourceKeys);
//         if (newKeys.length > 0) {
//           const newProperties = _.cloneDeep(_.pick(objectValue, newKeys));
//           const newSchemas = [];
//           for (const key of newKeys) {
//             const newSchema = convertTplBlock(newProperties[key], false, false);
//             newSchema['x-virtual'] = true;
//             // newSchema['name'] = key;
//             newSchemas.push(newSchema);
//             source['properties'][key] = newSchema;
//           }
//         }
//         const properties = {};
//         for (const key of keys) {
//           if (removedKeys.includes(key) || (!targetKeys.includes(key) && source.properties[key]?.['x-template-uid'])) {
//             continue;
//           }
//           properties[key] = mergeSchema(objectValue?.[key], sourceValue?.[key], api);
//         }
//         const parentIndexs = [];
//         // x-index 冲突则取最大值+1
//         for (const key in properties) {
//           if (properties[key]['x-index']) {
//             const xIndex = properties[key]['x-index'];
//             if (parentIndexs.includes(xIndex)) {
//               properties[key]['x-index'] = Math.max(...parentIndexs) + 1;
//             }
//             parentIndexs.push(properties[key]['x-index']);
//           }
//         }
//         return properties;
//       }

//       return mergeSchema(objectValue || {}, sourceValue, api);
//     }
//     return sourceValue;
//   });
// };

function findParentSchemaByUid(schema, uid, parent = null) {
  if (schema['x-uid'] === uid) {
    return { parent, schema };
  }
  for (const key in schema.properties) {
    const result = findParentSchemaByUid(schema.properties[key], uid, schema);
    if (result) {
      return result;
    }
  }
  return null;
}

function findFirstViatualSchema(schema, uid) {
  if (schema['x-uid'] === uid && schema['x-virtual']) {
    return {
      schema,
      insertTarget: schema['x-uid'],
      insertPosition: 'afterBegin',
    };
  }
  // 将properties转换成数组，且按x-index排序
  const properties = Object.values(schema.properties || {}).sort((a, b) => {
    return a['x-index'] - b['x-index'];
  });
  for (let i = 0; i < properties.length; i++) {
    const property = properties[i];
    const result = findFirstViatualSchema(property, uid);
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

function convertToCreateSchema(schema) {
  const getNewSchema = (schema) => {
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

export const XTemplate = observer((props) => {
  const api = useAPIClient();
  const currentSchema = useFieldSchema();
  const templateUid = currentSchema['x-template-uid'];
  const jsonSchema = currentSchema?.toJSON();
  const plugin = usePlugin(PluginBlocksTemplateClient);
  const app = useApp();
  // const scCtx = useSchemaComponentContext();
  // const ssCtx = useSchemaSettingsContext();
  const ssCtx = useSchemaSettings();
  // const t = useTranslation();
  const apiClient = useMemo(() => {
    const apiClient = new APIClient(app.getOptions().apiClient as any);
    apiClient.app = app;
    apiClient.oks = true;
    apiClient.axios.interceptors.request.use(async (config) => {
      if (config.url.includes('uiSchemas:remove')) {
        const uid = config.url.split('/').pop();
        const ret = findParentSchemaByUid(currentSchema?.root, uid);
        if (ret && ret.schema['x-component'] !== 'Grid.Row') {
          const { schema, parent } = ret;
          if (!parent['x-removed-properties']) {
            parent['x-removed-properties'] = [];
          }
          parent['x-removed-properties'].push(schema.name);
          api.request({
            url: `/uiSchemas:patch`,
            method: 'post',
            data: {
              'x-uid': parent['x-uid'],
              'x-removed-properties': parent['x-removed-properties'],
            },
          });
        }
      }

      if (config.url.includes('uiSchemas:patch')) {
        const xUid = config.data['x-uid'];
        const virtualSchema = findFirstViatualSchema(currentSchema?.root, xUid);
        if (virtualSchema) {
          const newSchema = convertToCreateSchema(virtualSchema.schema);
          await api.request({
            url: `/uiSchemas:insertAdjacent/${virtualSchema.insertTarget}?position=${virtualSchema.insertPosition}`,
            method: 'post',
            data: {
              schema: newSchema,
            },
          });
        }
      }

      // TODO: insertAdjacent  -> 有可能拖拽后失去模板同步性，需要仅将必须的属性同步到data中

      return config;
    });
    return apiClient;
  }, [app]);

  // const newS = useMemo(() => {
  //   return _.omit();
  // }, [currentSchema]);

  return (
    <APIClientProvider apiClient={apiClient}>
      <SchemaComponent schema={currentSchema} />
    </APIClientProvider>
  );
});
export default XTemplate;
