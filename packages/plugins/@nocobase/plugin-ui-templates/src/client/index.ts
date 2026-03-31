/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { ReferenceBlockModel } from './models/ReferenceBlockModel';
import { ReferenceFormGridModel } from './models/ReferenceFormGridModel';
import { SubModelTemplateImporterModel } from './models/SubModelTemplateImporterModel';
import { BlockTemplatesPage, PopupTemplatesPage } from './components/FlowModelTemplatesPage';
// @ts-ignore
import pkg from '../../package.json';
import { registerMenuExtensions } from './menuExtensions';
import { registerOpenViewPopupTemplateAction } from './openViewActionExtensions';

const NAMESPACE = 'ui-templates';

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
      title: `{{t("UI templates", { ns: "${pkg.name}", nsMode: "fallback" })}}`,
      icon: 'ProfileOutlined',
    });

    // 子级：区块模板 (v2)
    this.app.pluginSettingsManager.add(`${NAMESPACE}.block`, {
      title: `{{t("Block templates (v2)", { ns: "${pkg.name}", nsMode: "fallback" })}}`,
      Component: BlockTemplatesPage,
    });

    // 子级：弹窗模板 (v2)
    this.app.pluginSettingsManager.add(`${NAMESPACE}.popup`, {
      title: `{{t("Popup templates (v2)", { ns: "${pkg.name}", nsMode: "fallback" })}}`,
      Component: PopupTemplatesPage,
    });
    registerMenuExtensions();
  }
}

export default PluginBlockReferenceClient;
