/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { BlockTabs } from './BlockTabs';
import { BlockTabsInitializer } from './BlockTabsInitializer';
import { blockTabsSettings } from './BlockTabsSettings';
import { NAMESPACE } from '../common/constants';
import resources from './locale';

export class PluginBlockTabsClient extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    // 注册BlockTabs和BlockTabsInitializer组件
    this.app.addComponents({
      BlockTabs,
      BlockTabsInitializer,
    });

    // 注册翻译资源
    Object.keys(resources).forEach((lang) => {
      this.app.i18n.addResources(lang, NAMESPACE, resources[lang]);
    });

    // 添加到页面区块初始化器中
    const blockInitializers = this.app.schemaInitializerManager.get('page:addBlock');
    blockInitializers?.add('otherBlocks.blockTabs', {
      title: `{{t("Block Tabs", { ns: "${NAMESPACE}" })}}`,
      icon: 'FileTextOutlined',
      Component: 'BlockTabsInitializer',
    });

    // 添加到弹窗新增块初始化器中
    const createFormBlockInitializers = this.app.schemaInitializerManager.get('popup:addNew:addBlock');
    createFormBlockInitializers?.add('otherBlocks.blockTabs', {
      title: `{{t("Block Tabs", { ns: "${NAMESPACE}" })}}`,
      icon: 'FileTextOutlined',
      Component: 'BlockTabsInitializer',
    });

    // 添加到弹窗通用块初始化器中
    const recordBlockInitializers = this.app.schemaInitializerManager.get('popup:common:addBlock');
    recordBlockInitializers?.add('otherBlocks.blockTabs', {
      title: `{{t("Block Tabs", { ns: "${NAMESPACE}" })}}`,
      icon: 'FileTextOutlined',
      Component: 'BlockTabsInitializer',
    });

    // 添加到记录表单块初始化器中
    const recordFormBlockInitializers = this.app.schemaInitializerManager.get('RecordFormBlockInitializers');
    recordFormBlockInitializers?.add('otherBlocks.blockTabs', {
      title: `{{t("Block Tabs", { ns: "${NAMESPACE}" })}}`,
      icon: 'FileTextOutlined',
      Component: 'BlockTabsInitializer',
    });

    // 添加到移动端页面初始化器中
    this.app.schemaInitializerManager.addItem('mobilePage:addBlock', 'otherBlocks.blockTabs', {
      title: `{{t("Block Tabs", { ns: "${NAMESPACE}" })}}`,
      icon: 'FileTextOutlined',
      Component: 'BlockTabsInitializer',
    });

    // 添加到移动端初始化器中
    this.app.schemaInitializerManager.addItem('mobile:addBlock', 'otherBlocks.blockTabs', {
      title: `{{t("Block Tabs", { ns: "${NAMESPACE}" })}}`,
      icon: 'FileTextOutlined',
      Component: 'BlockTabsInitializer',
    });

    // 添加schema设置
    this.app.schemaSettingsManager.add(blockTabsSettings);
  }
}

export default PluginBlockTabsClient;
