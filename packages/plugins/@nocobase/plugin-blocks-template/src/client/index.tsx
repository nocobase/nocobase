/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
import { resetSettingItem } from './settings/resetSetting';

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

const getFullSchema = (schema, templateschemacache) => {
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
};

const mergeSchema = (target, source, rootId, templateschemacache) => {
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
  });
};

function collectAllTemplateUids(schema, uids = new Set()) {
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

export class PluginBlocksTemplateClient extends Plugin {
  #api = new APIClient();
  #loadingPromises = new Map();
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
        const templateUids = collectAllTemplateUids(s);
        let pendingPromise = this.#loadingPromises.get(s['x-uid']);
        if (!pendingPromise) {
          pendingPromise = this.#fetchAllTemplates(templateUids, s);
          if (pendingPromise) {
            this.#loadingPromises.set(s['x-uid'], pendingPromise);
          }
        }

        if (pendingPromise) {
          throw pendingPromise;
        }

        // const sc = mergeSchema(_.cloneDeep(this.templateschemacache[s['x-template-root-uid']]), s, s['x-uid']);
        const sc = getFullSchema(s, this.templateschemacache);
        this.templateBlocks[sc['x-uid']] = sc;
        return sc;
      }
      return s;
    });

    this.app.apiClient.axios.interceptors.request.use(async (config) => {
      if (config.url.includes('uiSchemas:remove')) {
        const uidWithQuery = config.url.split('/').pop();
        const uid = uidWithQuery.split('?')[0];
        const query = uidWithQuery.split('?')[1];
        const skipRemovePatch = query?.includes('resettemplate=true');
        const currentSchema = findSchemaCache(this.templateBlocks, uid);
        const ret = findParentSchemaByUid(currentSchema, uid);
        if (ret && ret.parent && !skipRemovePatch) {
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

    this.app.schemaInitializerManager.addItem('popup:common:addBlock', 'templates', {
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
      // @ts-ignore
      this.app.schemaSettingsManager.addItem(key, '关联记录', associationRecordSettingItem);
      // @ts-ignore
      this.app.schemaSettingsManager.addItem(key, '重置', resetSettingItem);
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

  #fetchAllTemplates(templateUids, schema) {
    const promises = [];

    for (const uid of templateUids) {
      if (!this.templateschemacache[uid]) {
        this.templateschemacache[uid] = this.#api
          .request({
            url: `/api/uiSchemas:getJsonSchema/${uid}`,
          })
          .then((res) => {
            this.templateschemacache[uid] = res?.data?.data;
            return this.templateschemacache[uid];
          })
          .catch((error) => {
            console.error(`Failed to fetch template schema for uid ${uid}:`, error);
            delete this.templateschemacache[uid];
            return null;
          });
        promises.push(this.templateschemacache[uid]);
      } else if (this.templateschemacache[uid].then) {
        promises.push(this.templateschemacache[uid]);
      }
    }

    if (promises.length > 0) {
      return new Promise((resolve) => {
        Promise.all(promises)
          .then(() => {
            this.#loadingPromises.delete(schema['x-uid']);
            resolve(null);
          })
          .catch((error) => {
            console.error('Failed to fetch template schemas:', error);
            this.#loadingPromises.delete(schema['x-uid']);
            resolve(null);
          });
      });
    }
    return null;
  }
}

export default PluginBlocksTemplateClient;
