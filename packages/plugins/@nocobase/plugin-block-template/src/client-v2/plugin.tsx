/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Schema, type ISchema } from '@formily/json-schema';
import { Plugin } from '@nocobase/client-v2';

import { generateNTemplate, NAMESPACE } from './locale';
import { mergeTemplateSchema } from './utils/template';

export class PluginBlockTemplateClient extends Plugin {
  templateInfos = new Map<string, any>();
  templateschemacache: Record<string, any> = {};
  pageBlocks: Record<string, any> = {};
  savedSchemaUids = new Set<string>();

  async load() {
    Schema.registerPatches((schema: ISchema) => {
      if (schema['x-template-infos']) {
        for (const key of Object.keys(schema['x-template-infos'])) {
          this.templateInfos.set(key, schema['x-template-infos'][key]);
        }
        delete schema['x-template-infos'];
      }

      if (schema['x-template-schemas']) {
        for (const key of Object.keys(schema['x-template-schemas'])) {
          this.templateschemacache[key] = schema['x-template-schemas'][key];
        }
        delete schema['x-template-schemas'];
      }

      if (schema['x-template-root-uid'] || schema['x-block-template-key']) {
        const merged = mergeTemplateSchema(schema, this.templateschemacache, this.templateInfos, this.savedSchemaUids);
        if (merged?.['x-uid']) {
          this.pageBlocks[merged['x-uid']] = merged;
        }
        return merged;
      }

      return schema;
    });

    this.app.pluginSettingsManager.addMenuItem({
      key: 'block-template-legacy',
      title: generateNTemplate('Block templates (v1)'),
      icon: 'ProfileOutlined',
      aclSnippet: 'pm.block-templates',
    });
    this.app.pluginSettingsManager.addPageTabItem({
      menuKey: 'block-template-legacy',
      key: 'index',
      componentLoader: () =>
        import('./components/LegacyTemplateSettingsPage').then((mod) => ({ default: mod.LegacyTemplateSettingsPage })),
      aclSnippet: 'pm.block-templates',
    });
  }

  isInBlockTemplateConfigPage() {
    return window.location.pathname.includes('admin/settings/block-template-legacy');
  }

  setTemplateCache = (schema?: ISchema) => {
    if (!schema?.['x-uid']) {
      return;
    }
    this.templateschemacache[schema['x-uid']] = schema;
  };

  clearTemplateCache = (templateRootUid: string) => {
    delete this.templateschemacache[templateRootUid];
  };
}

export { NAMESPACE };
export default PluginBlockTemplateClient;
