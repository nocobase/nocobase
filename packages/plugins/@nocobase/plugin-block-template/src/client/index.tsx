/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BlockTemplatesPane, Plugin, SchemaSettingsFormItemTemplate, SchemaSettingsTemplate } from '@nocobase/client';
import { templateBlockInitializerItem } from './initializers';
import { NAMESPACE } from './constants';
import { BlockTemplateList, BlockTemplatePage } from './components';
import { ISchema, Schema } from '@formily/json-schema';
import * as _ from 'lodash';
import { revertSettingItem } from './settings/revertSetting';
import { getFullSchema } from './utils/template';
import { registerTemplateBlockInterceptors } from './utils/interceptors';
import { TemplateGridDecorator } from './components/TemplateGridDecorator';
import PluginMobileClient from '@nocobase/plugin-mobile/client';
import { BlockTemplateMobilePage } from './components/BlockTemplateMobilePage';
import {
  hideBlocksFromTemplate,
  hideConnectDataBlocksFromTemplate,
  hideConvertToBlockSettingItem,
  hideDeleteSettingItem,
} from './utils/setting';
import { BlockTemplateMenusProvider } from './components/BlockTemplateMenusProvider';
import { disabledDeleteSettingItem } from './settings/disabledDeleteSetting';
import { saveAsTemplateSetting } from './settings/saveAsTemplateSetting';
import { convertToNormalBlockSettingItem } from './settings/convertToNormalBlockSetting';

export class PluginBlockTemplateClient extends Plugin {
  templateInfos = new Map();
  templateschemacache = {};
  pageBlocks = {};
  savedSchemaUids = new Set<string>();
  injectInitializers = [
    'page:addBlock',
    'popup:common:addBlock',
    'popup:addNew:addBlock',
    'mobile:addBlock',
    'mobile:popup:common:addBlock',
  ];

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

      // add version check here is to avoid modifying the template schema before insertAdjacent api
      // otherwise, the template root schema will be a full copy of the original schema
      if (s['x-template-root-uid'] && (s['version'] || s['x-template-root-ref'])) {
        const sc = getFullSchema(s, this.templateschemacache, this.templateInfos, this.savedSchemaUids);
        this.pageBlocks[sc['x-uid']] = sc;
        return sc;
      }
      return s;
    });

    // Register axios interceptors for template block operations
    registerTemplateBlockInterceptors(this.app.apiClient, this.pageBlocks, this.savedSchemaUids);

    this.app.addComponents({ TemplateGridDecorator });
    this.app.addProviders([BlockTemplateMenusProvider]);

    for (const initializer of this.injectInitializers) {
      this.app.schemaInitializerManager.addItem(initializer, 'otherBlocks.templates', templateBlockInitializerItem);
    }

    this.#afterAllPluginsLoaded();
    this.app.pluginSettingsManager.add('block-templates', {
      title: `{{t("Block templates", { ns: "${NAMESPACE}" })}}`,
      icon: 'ProfileOutlined',
      // Component: BlockTemplateList,
    });

    this.app.pluginSettingsManager.add(`block-templates.reference`, {
      title: `{{t("Reference template")}}`,
      Component: BlockTemplatesPane,
    });

    this.app.pluginSettingsManager.add(`block-templates.inherited`, {
      title: `{{t("Inherited template")}}`,
      Component: BlockTemplateList,
    });

    this.app.pluginSettingsManager.add(`block-templates/inherited/:key`, {
      title: false,
      pluginKey: 'block-templates',
      isTopLevel: false,
      Component: BlockTemplatePage,
    });

    // add mobile router
    this.app.pluginManager.get<PluginMobileClient>('mobile')?.mobileRouter?.add('mobile.schema.blockTemplate', {
      path: `/block-templates/inherited/:key/:pageSchemaUid`,
      Component: BlockTemplateMobilePage,
    });
  }

  isInBlockTemplateConfigPage() {
    const mobilePath =
      this.app.pluginManager.get<PluginMobileClient>('mobile')?.mobileBasename + '/block-templates/inherited';
    const desktopPath = 'admin/settings/block-templates/inherited';
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

        hideBlocksFromTemplate(this.injectInitializers, this.app);
        // add template settings
        const schemaSettings = this.app.schemaSettingsManager.getAll();
        for (const key in schemaSettings) {
          const schemaSetting = this.app.schemaSettingsManager.get(key);
          // if not filter out fieldSettings:component:, we will show two revert setting item
          if (schemaSetting && !key.startsWith('fieldSettings:component:')) {
            for (let i = 0; i < schemaSetting.items.length; i++) {
              // hide reference template setting item
              hideConvertToBlockSettingItem(
                schemaSetting.items[i],
                schemaSetting.items[i - 1],
                schemaSetting.items[i + 1],
              );
              // hide connect data blocks setting item from template configure page
              hideConnectDataBlocksFromTemplate(schemaSetting.items[i]);
              // hide delete setting item
              hideDeleteSettingItem(schemaSetting.items[i], schemaSetting.items[i - 1]);
            }
            const deleteItemIndex = schemaSetting.items.findIndex((item, index) => {
              const nextItem = schemaSetting.items[index + 1];
              return item['type'] === 'divider' && (nextItem?.name === 'delete' || nextItem?.name === 'remove');
            });
            if (
              deleteItemIndex !== -1 &&
              !schemaSetting.items.find((item) => item.name === 'template-revertSettingItem')
            ) {
              schemaSetting.items.splice(deleteItemIndex, 0, revertSettingItem, convertToNormalBlockSettingItem);
            } else {
              schemaSetting.add('template-revertSettingItem', revertSettingItem);
              schemaSetting.add('template-convertToNormalBlockSettingItem', convertToNormalBlockSettingItem);
            }
            schemaSetting.add('template-disabledDeleteItem', disabledDeleteSettingItem);
          }
          const blockSettings = [
            'blockSettings:calendar',
            'blockSettings:createForm',
            'blockSettings:details',
            'blockSettings:detailsWithPagination',
            'blockSettings:stepsForm',
            'blockSettings:filterCollapse',
            'blockSettings:filterForm',
            'blockSettings:gantt',
            'blockSettings:gridCard',
            'blockSettings:kanban',
            'blockSettings:list',
            'blockSettings:table',
            'blockSettings:tree',
            'ReadPrettyFormSettings',
            'GanttBlockSettings',
            'FormV1Settings',
            'FormSettings',
            'FormItemSettings',
            'FormDetailsSettings',
          ];
          if (blockSettings.includes(key)) {
            const referenceTemplateItemIndex = schemaSetting.items.findIndex(
              (item) =>
                item['Component'] === SchemaSettingsTemplate || item['Component'] === SchemaSettingsFormItemTemplate,
            );
            if (referenceTemplateItemIndex !== -1) {
              schemaSetting.items.splice(referenceTemplateItemIndex + 1, 0, {
                ...saveAsTemplateSetting,
                sort: schemaSetting.items[referenceTemplateItemIndex].sort,
              });
            }
          }
        }
      }
    }, 1000);
  };
}

export default PluginBlockTemplateClient;
