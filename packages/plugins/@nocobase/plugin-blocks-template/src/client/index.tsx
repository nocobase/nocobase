/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/* eslint-disable */

import { APIClient, Plugin } from '@nocobase/client';
import { tStr } from './locale';
import { convertTplBlock, TemplateBlockInitializer } from './initializers/TemplateBlockInitializer';
import XTemplate from './components/XTemplate';
import { BlockNameLowercase, NAMESPACE } from './constants';
import { BlocksTemplateList } from './components/BlocksTemplateList';
import { BlocksTemplatePage } from './components/BlocksTemplatePage';
import { addBlockInitializers } from './initializers/addBlockInitializers';
// import { registerPatches } from '@formily/';
import { registerPatches } from '@formily/json-schema/esm/patches';
import { ISchema, Schema } from '@formily/json-schema';
import * as _ from 'lodash';
import { associationRecordSettingItem } from './settings/associationRecordSetting';

function findSchemaCache(cache, uid) {
  const isChild = (schema, uid) => {
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

function findParentSchemaByUid(schema, uid, parent = null, key?: string) {
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

function findFirstViatualSchema(schema, uid) {
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

const mergeSchema = (target, source, rootId) => {
  return _.mergeWith(target, source, (objectValue, sourceValue, keyName, object, source) => {
    if (sourceValue == null) {
      return objectValue;
    }
    if (_.isObject(sourceValue)) {
      if (_.isArray(sourceValue)) {
        return _.union(objectValue || [], sourceValue);
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
            // newSchema['x-virtual'] = true;
            //TODO: x-virtual for all children
            newSchema['name'] = key;
            newSchemas.push(newSchema);
            source['properties'][key] = newSchema;
          }
        }
        const properties = {};
        for (const key of keys) {
          if (removedKeys.includes(key)) {
            continue;
          }
          const sourceProperty = sourceValue?.[key] || {};
          if (_.get(objectValue, [key, 'properties'])) {
            sourceProperty['properties'] = sourceProperty['properties'] || {};
          }
          properties[key] = mergeSchema(objectValue?.[key], sourceValue?.[key], rootId);
          if (properties[key]['x-component'] === undefined) {
            delete properties[key]; // 说明已经从模板中删除了
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

      return mergeSchema(objectValue || {}, sourceValue, rootId);
    }
    return sourceValue;
  });
};

export class PluginBlocksTemplateClient extends Plugin {
  #api = new APIClient();
  templateschemacache = {};
  // #schemas = {};
  templateBlocks = {};

  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {}

  async load() {
    registerPatches((s: ISchema) => {
      if (s['x-template-root-uid'] && s['version']) {
        const tplSchemaUid = s['x-template-root-uid'];
        if (!this.templateschemacache[tplSchemaUid]) {
          // eslint-disable-next-line promise/catch-or-return
          this.templateschemacache[tplSchemaUid] = new Promise((resolve) => {
            this.#api
              .request({
                url: `/api/uiSchemas:getJsonSchema/${tplSchemaUid}`,
              })
              .then((res) => {
                this.templateschemacache[tplSchemaUid] = res?.data?.data;
                resolve(this.templateschemacache[tplSchemaUid]);
              });
          });
          throw this.templateschemacache[tplSchemaUid];
        } else if (this.templateschemacache[tplSchemaUid].then) {
          throw this.templateschemacache[tplSchemaUid];
        } else {
          const sc = mergeSchema(_.cloneDeep(this.templateschemacache[tplSchemaUid]), s, s['x-uid']);
          // console.log('s', s);
          this.templateBlocks[sc['x-uid']] = sc;
          return sc;
        }
      }
      return s;
    });

    this.app.apiClient.axios.interceptors.request.use(async (config) => {
      if (config.url.includes('uiSchemas:remove')) {
        const uid = config.url.split('/').pop();
        const currentSchema = findSchemaCache(this.templateBlocks, uid);
        const ret = findParentSchemaByUid(currentSchema, uid);
        if (ret && ret.parent) {
          const { schema, parent } = ret;
          if (!parent['x-removed-properties']) {
            parent['x-removed-properties'] = [];
          }
          parent['x-removed-properties'].push(ret.key);
          this.app.apiClient.request({
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
        const currentSchema = findSchemaCache(this.templateBlocks, xUid);
        const virtualSchema = findFirstViatualSchema(currentSchema, xUid);
        if (virtualSchema) {
          const newSchema = convertToCreateSchema(virtualSchema.schema);
          await this.app.apiClient.request({
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

    // TODO: why any here?
    this.app.addComponents({ XTemplate, TemplateBlockInitializer: TemplateBlockInitializer as any });

    this.app.schemaInitializerManager.addItem('page:addBlock', 'templates', {
      name: BlockNameLowercase,
      Component: 'TemplateBlockInitializer',
      title: tStr('Templates'),
      icon: 'TableOutlined',
      sort: -1,
      wrap: (t) => t,
    });
    this.app.schemaInitializerManager;

    this.app.schemaInitializerManager.add(addBlockInitializers);

    const schameSettings = this.app.schemaSettingsManager.getAll();
    for (const key in schameSettings) {
      this.app.schemaSettingsManager.addItem(key, '关联记录', associationRecordSettingItem);
    }

    this.app.pluginSettingsManager.add('blocks-templates', {
      title: `{{t("Blocks templates", { ns: "${NAMESPACE}" })}}`,
      icon: 'TableOutlined',
      Component: BlocksTemplateList,
    });

    this.app.pluginSettingsManager.add(`blocks-templates/:key`, {
      title: false,
      pluginKey: 'blocks-templates',
      isTopLevel: false,
      Component: BlocksTemplatePage,
    });

    // TODO: add blocks in 'mobile:addBlock' and 'popup:common:addBlock'
  }
}

export default PluginBlocksTemplateClient;
