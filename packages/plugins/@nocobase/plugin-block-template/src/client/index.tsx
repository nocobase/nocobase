/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin, SchemaSettingsFormItemTemplate, SchemaSettingsTemplate } from '@nocobase/client';
import { TemplateBlockInitializer, addBlockInitializers } from './initializers';
import { BlockNameLowercase, NAMESPACE } from './constants';
import { BlockTemplateList, BlockTemplatePage } from './components';
import { ISchema, Schema } from '@formily/json-schema';
import * as _ from 'lodash';
import { associationRecordSettingItem, resetSettingItem, formSettingItem } from './settings';
import { collectAllTemplateUids, getFullSchema } from './utils/template';
import { registerTemplateBlockInterceptors } from './utils/interceptors';

export class PluginBlockTemplateClient extends Plugin {
  loadingPromises = new Map();
  templateschemacache = {};
  // #schemas = {};
  templateBlocks = {};

  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {}

  async load() {
    Schema.registerPatches((s: ISchema) => {
      if (s['x-template-root-uid'] && s['version']) {
        const templateUids = collectAllTemplateUids(s);
        let pendingPromise = this.loadingPromises.get(s['x-uid']);
        if (!pendingPromise) {
          pendingPromise = this.#fetchAllTemplates(templateUids, s);
          if (pendingPromise) {
            this.loadingPromises.set(s['x-uid'], pendingPromise);
          }
        }

        if (pendingPromise && !pendingPromise['__done']) {
          // This is React Suspense's internal mechanism for data fetching
          // When a promise is thrown, React will catch it and render the nearest <Suspense> fallback
          // Once the promise resolves, React will re-render the component with the data
          // See: https://github.com/facebook/react/issues/13206
          // See also: https://react.dev/reference/react/Suspense#usage
          throw pendingPromise; // will be handled by react suspense, this is not a real error
        }

        const sc = getFullSchema(s, this.templateschemacache);
        this.templateBlocks[sc['x-uid']] = sc;
        return sc;
      }
      return s;
    });

    // Register axios interceptors for template block operations
    registerTemplateBlockInterceptors(this.app.apiClient, this.templateBlocks);

    this.app.addComponents({ TemplateBlockInitializer: TemplateBlockInitializer as any });

    this.app.schemaInitializerManager.addItem('page:addBlock', 'templates', {
      name: BlockNameLowercase,
      Component: 'TemplateBlockInitializer',
      title: '{{t("Templates")}}',
      icon: 'TableOutlined',
      sort: -1,
      wrap: (t) => t,
      useVisible: () => {
        // check if url contains admin/settings/block-templates
        return !window.location.pathname.includes('admin/settings/block-templates');
      },
    });

    this.app.schemaInitializerManager.addItem('popup:common:addBlock', 'templates', {
      name: BlockNameLowercase,
      Component: 'TemplateBlockInitializer',
      title: '{{t("Templates")}}',
      icon: 'TableOutlined',
      sort: -1,
      wrap: (t) => t,
      useVisible: () => {
        // check if url contains admin/settings/block-templates
        return !window.location.pathname.includes('admin/settings/block-templates');
      },
    });

    this.app.schemaInitializerManager.addItem('popup:addNew:addBlock', 'templates', {
      name: BlockNameLowercase,
      Component: 'TemplateBlockInitializer',
      title: '{{t("Templates")}}',
      icon: 'TableOutlined',
      sort: -1,
      wrap: (t) => t,
      useVisible: () => {
        // check if url contains admin/settings/block-templates
        return !window.location.pathname.includes('admin/settings/block-templates');
      },
    });

    this.app.schemaInitializerManager.add(addBlockInitializers);

    this.#loadSchemaSettings();
    this.app.pluginSettingsManager.add('block-templates', {
      title: `{{t("Block templates", { ns: "${NAMESPACE}" })}}`,
      icon: 'TableOutlined',
      Component: BlockTemplateList,
    });

    this.app.pluginSettingsManager.add(`block-templates/:key`, {
      title: false,
      pluginKey: 'block-templates',
      isTopLevel: false,
      Component: BlockTemplatePage,
    });
  }

  #fetchAllTemplates(templateUids, schema) {
    const promises = [];

    for (const uid of templateUids) {
      if (!this.templateschemacache[uid]) {
        this.templateschemacache[uid] = this.app.apiClient
          .request({
            url: `/uiSchemas:getJsonSchema/${uid}`,
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
            // this.loadingPromises.delete(schema['x-uid']);
            this.loadingPromises.get(schema['x-uid'])['__done'] = true;
            resolve(null);
          })
          .catch((error) => {
            console.error('Failed to fetch template schemas:', error);
            this.loadingPromises.delete(schema['x-uid']);
            resolve(null);
          });
      });
    }
    return null;
  }

  #loadSchemaSettings() {
    // Check if this.app.loading is true every 1s
    // If true, wait 1s and check again
    // If false, stop checking and add template settings
    const interval = setInterval(() => {
      if (!this.app.loading) {
        clearInterval(interval);
        const schemaSettings = this.app.schemaSettingsManager.getAll();
        for (const key in schemaSettings) {
          const schemaSetting = this.app.schemaSettingsManager.get(key);
          if (schemaSetting) {
            schemaSetting.add('template-associationRecordSetting', associationRecordSettingItem);
            schemaSetting.add('template-resetSettingItem', resetSettingItem);
            schemaSetting.add('template-formSettingItem', formSettingItem);
            for (let i = 0; i < schemaSetting.items.length; i++) {
              if (
                schemaSetting.items[i]['Component'] === SchemaSettingsTemplate ||
                schemaSetting.items[i]['Component'] === SchemaSettingsFormItemTemplate
              ) {
                const visible = schemaSetting.items[i]['useVisible'] || (() => true);
                schemaSetting.items[i]['useVisible'] = () => {
                  const notInBlockTemplate = !window.location.pathname.includes('admin/settings/block-templates');
                  return notInBlockTemplate && visible();
                };
                if (schemaSetting.items[i + 1]?.['type'] === 'divider') {
                  schemaSetting.items[i + 1]['useVisible'] = () => {
                    const notInBlockTemplate = !window.location.pathname.includes('admin/settings/block-templates');
                    return notInBlockTemplate;
                  };
                }
              }
            }
          }
        }
      }
    }, 1000);
  }
}

export default PluginBlockTemplateClient;
