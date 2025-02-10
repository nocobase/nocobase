/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PluginBlockTemplateClient } from '..';
import { useIsInTemplate } from '../hooks/useIsInTemplate';
import {
  Application,
  SchemaSettingsFormItemTemplate,
  SchemaSettingsItemType,
  SchemaSettingsTemplate,
  usePlugin,
} from '@nocobase/client';

export const hideConvertToBlockSettingItem = (
  settingItem: SchemaSettingsItemType,
  nextSettingItem: SchemaSettingsItemType,
) => {
  if (
    settingItem['Component'] === SchemaSettingsTemplate ||
    settingItem['Component'] === SchemaSettingsFormItemTemplate
  ) {
    // const visible = schemaSetting.items[i]['useVisible'] || (() => true);
    // schemaSetting.items[i]['useVisible'] = () => {
    //   const notInBlockTemplate = !window.location.pathname.includes('admin/settings/block-templates');
    //   return notInBlockTemplate && visible();
    // };

    // hide covert to block setting item
    settingItem['useVisible'] = () => false;
    if (nextSettingItem?.['type'] === 'divider') {
      nextSettingItem['useVisible'] = () => false;
    }
  }
};

export const hideDeleteSettingItem = (settingItem: SchemaSettingsItemType) => {
  if (settingItem['name'] === 'delete' || settingItem['name'] === 'remove') {
    const visible = settingItem['useVisible'] || (() => true);
    settingItem['useVisible'] = function useVisible() {
      const isInTemplate = useIsInTemplate(false);
      return !isInTemplate && visible();
    };
  }
  // recursive for nested items
  const children = settingItem['items'] || settingItem['children'];
  if (children) {
    for (const item of children) {
      hideDeleteSettingItem(item);
    }
  }
};

export const hideBlocksFromTemplate = (initializers: string[], app: Application) => {
  const hiddenBlocks = ['ChartV2BlockInitializer', 'WorkflowTodo.Initializer', 'ApprovalBlock.BlockInitializer']; // the blocks that should be hidden from template
  for (const initializerName of initializers) {
    const initializer = app.schemaInitializerManager.get(initializerName);
    if (initializer && initializer.items) {
      for (const item of initializer.items) {
        for (const child of item.children || []) {
          if (hiddenBlocks.includes(child.Component)) {
            const visible = child.useVisible || (() => true);
            child.useVisible = function useVisible() {
              const plugin = usePlugin(PluginBlockTemplateClient);
              return visible() && plugin && !plugin?.isInBlockTemplateConfigPage();
            };
          }
        }
      }
    }
  }
};
