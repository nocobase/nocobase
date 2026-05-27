/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { lazy, Plugin } from '@nocobase/client';
import { ReferenceBlockModel } from '../client-v2/models/ReferenceBlockModel';
import { ReferenceFormGridModel } from '../client-v2/models/ReferenceFormGridModel';
import { SubModelTemplateImporterModel } from '../client-v2/models/SubModelTemplateImporterModel';
import { registerMenuExtensions } from '../client-v2/menuExtensions';
import { registerOpenViewPopupTemplateAction } from '../client-v2/openViewActionExtensions';

const NAMESPACE = 'ui-templates';
const PLUGIN_NAMESPACE = '@nocobase/plugin-ui-templates';
const BlockTemplatesPage = lazy(() => import('../client-v2/pages/BlockTemplatesPage'));
const PopupTemplatesPage = lazy(() => import('../client-v2/pages/PopupTemplatesPage'));

export class PluginBlockReferenceClient extends Plugin {
  async load() {
    this.flowEngine.registerModels({
      ReferenceBlockModel,
      ReferenceFormGridModel,
      SubModelTemplateImporterModel,
    });
    registerOpenViewPopupTemplateAction(this.flowEngine);

    // 父级菜单（只有标题，无组件）
    this.app.pluginSettingsManager.add(NAMESPACE, {
      title: `{{t("UI templates", { ns: "${PLUGIN_NAMESPACE}", nsMode: "fallback" })}}`,
      icon: 'ProfileOutlined',
      aclSnippet: 'pm.ui-templates.templates',
    });

    // 子级：区块模板
    this.app.pluginSettingsManager.add(`${NAMESPACE}.block`, {
      title: `{{t("Block templates", { ns: "${PLUGIN_NAMESPACE}", nsMode: "fallback" })}}`,
      Component: BlockTemplatesPage,
      aclSnippet: 'pm.ui-templates.templates',
    });

    // 子级：弹窗模板
    this.app.pluginSettingsManager.add(`${NAMESPACE}.popup`, {
      title: `{{t("Popup templates", { ns: "${PLUGIN_NAMESPACE}", nsMode: "fallback" })}}`,
      Component: PopupTemplatesPage,
      aclSnippet: 'pm.ui-templates.templates',
    });
    registerMenuExtensions();
  }
}

export default PluginBlockReferenceClient;
