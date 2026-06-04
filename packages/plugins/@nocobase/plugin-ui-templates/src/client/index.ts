/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import {
  blockTemplatesPageLoader,
  popupTemplatesPageLoader,
  registerLegacyUiTemplateExtensions,
  registerLegacyUiTemplateModelLoaders,
} from './legacyV2Bridge';

const NAMESPACE = 'ui-templates';
const PLUGIN_NAMESPACE = '@nocobase/plugin-ui-templates';

export class PluginBlockReferenceClient extends Plugin {
  async load() {
    registerLegacyUiTemplateModelLoaders(this.flowEngine);
    registerLegacyUiTemplateExtensions(this.flowEngine);

    // 父级菜单（只有标题，无组件）
    this.app.pluginSettingsManager.add(NAMESPACE, {
      title: `{{t("UI templates", { ns: "${PLUGIN_NAMESPACE}", nsMode: "fallback" })}}`,
      icon: 'ProfileOutlined',
      aclSnippet: 'pm.ui-templates.templates',
    });

    // 子级：区块模板
    this.app.pluginSettingsManager.add(`${NAMESPACE}.block`, {
      title: `{{t("Block templates", { ns: "${PLUGIN_NAMESPACE}", nsMode: "fallback" })}}`,
      componentLoader: blockTemplatesPageLoader,
      aclSnippet: 'pm.ui-templates.templates',
    });

    // 子级：弹窗模板
    this.app.pluginSettingsManager.add(`${NAMESPACE}.popup`, {
      title: `{{t("Popup templates", { ns: "${PLUGIN_NAMESPACE}", nsMode: "fallback" })}}`,
      componentLoader: popupTemplatesPageLoader,
      aclSnippet: 'pm.ui-templates.templates',
    });
  }
}

export default PluginBlockReferenceClient;
