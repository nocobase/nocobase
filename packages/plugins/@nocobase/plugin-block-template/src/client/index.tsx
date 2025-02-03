/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { templateBlockInitializerItem } from './initializers';
import { NAMESPACE } from './constants';
import { BlockTemplateList, BlockTemplatePage } from './components';
import { ISchema, Schema } from '@formily/json-schema';
import * as _ from 'lodash';
import { associationRecordSettingItem, revertSettingItem, formSettingItem } from './settings';
import { collectAllTemplateUids, getFullSchema } from './utils/template';
import { registerTemplateBlockInterceptors } from './utils/interceptors';
import { TemplateGridDecorator } from './components/TemplateGridDecorator';
import PluginMobileClient from '@nocobase/plugin-mobile/client';
import { BlockTemplateMobilePage } from './components/BlockTemplateMobilePage';
import { hideConvertToBlockSettingItem, hideDeleteSettingItem } from './utils/setting';

export class PluginBlockTemplateClient extends Plugin {
  templateInfos = new Map();
  templateschemacache = {};
  pageBlocks = {};

  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {}

  async load() {
    Schema.registerPatches((s: ISchema) => {
      if (s['x-template-infos']) {
        for (const key in s['x-template-infos']) {
          const templateInfo = s['x-template-infos'][key];
          this.templateInfos.set(key, templateInfo);
        }
        delete s['x-template-infos'];
      }

      if (s['x-template-schemas']) {
        for (const key in s['x-template-schemas']) {
          const templateSchema = s['x-template-schemas'][key];
          this.templateschemacache[key] = templateSchema;
        }
        delete s['x-template-schemas'];
      }

      if (s['x-template-root-uid'] && s['version']) {
        const sc = getFullSchema(s, this.templateschemacache, this.templateInfos);
        this.pageBlocks[sc['x-uid']] = sc;
        return sc;
      }
      return s;
    });

    // Register axios interceptors for template block operations
    registerTemplateBlockInterceptors(this.app.apiClient, this.pageBlocks);

    this.app.addComponents({ TemplateGridDecorator });

    this.app.schemaInitializerManager.addItem('page:addBlock', 'templates', templateBlockInitializerItem);

    this.app.schemaInitializerManager.addItem('popup:common:addBlock', 'templates', templateBlockInitializerItem);

    this.app.schemaInitializerManager.addItem('popup:addNew:addBlock', 'templates', templateBlockInitializerItem);

    this.app.schemaInitializerManager.addItem('mobile:addBlock', 'templates', templateBlockInitializerItem);

    this.app.schemaInitializerManager.addItem(
      'mobile:popup:common:addBlock',
      'templates',
      templateBlockInitializerItem,
    );

    this.#afterAllPluginsLoaded();
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

    // add mobile router
    this.app.pluginManager.get<PluginMobileClient>('mobile')?.mobileRouter?.add('mobile.schema.blockTemplate', {
      path: `/block-templates/:key/:pageSchemaUid`,
      Component: BlockTemplateMobilePage,
    });
  }

  isInBlockTemplateConfigPage() {
    const mobilePath = this.app.pluginManager.get<PluginMobileClient>('mobile')?.mobileBasename + '/block-templates';
    const desktopPath = 'admin/settings/block-templates';
    return window.location.pathname.includes(desktopPath) || window.location.pathname.includes(mobilePath);
  }

  setTemplateCache = (schema?: ISchema) => {
    if (!schema) {
      return;
    }
    this.templateschemacache[schema['x-uid']] = schema;
  };

  clearTemplateCache = (templateRootUid: string) => {
    delete this.templateschemacache[templateRootUid];
  };

  #afterAllPluginsLoaded = () => {
    // Check if this.app.loading is true every 1s
    // If true, wait 1s and check again
    // If false, stop checking and add template settings
    const interval = setInterval(() => {
      if (!this.app.loading) {
        clearInterval(interval);

        // add template settings
        const schemaSettings = this.app.schemaSettingsManager.getAll();
        for (const key in schemaSettings) {
          const schemaSetting = this.app.schemaSettingsManager.get(key);
          // if not filter out fieldSettings:component:, we will show two revert setting item
          if (schemaSetting && !key.startsWith('fieldSettings:component:')) {
            schemaSetting.add('template-associationRecordSetting', associationRecordSettingItem);
            schemaSetting.add('template-revertSettingItem', revertSettingItem);
            schemaSetting.add('template-formSettingItem', formSettingItem);

            for (let i = 0; i < schemaSetting.items.length; i++) {
              // hide convert to block setting item
              hideConvertToBlockSettingItem(schemaSetting.items[i], schemaSetting.items[i + 1]);
              // hide delete setting item
              hideDeleteSettingItem(schemaSetting.items[i]);
            }
          }
        }
      }
    }, 1000);
  };
}

export default PluginBlockTemplateClient;
