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
import { FlowModelTemplatesPage } from './components/FlowModelTemplatesPage';
// @ts-ignore
import pkg from '../../package.json';
import { registerMenuExtensions } from './menuExtensions';

export class PluginBlockReferenceClient extends Plugin {
  async load() {
    this.flowEngine.registerModels({ ReferenceBlockModel });
    this.app.pluginSettingsManager.add('flow-model-templates', {
      title: `{{t("Block template", { ns: "${pkg.name}", nsMode: "fallback" })}}`,
      icon: 'ProfileOutlined',
      path: '/settings/flow-model-templates',
      Component: FlowModelTemplatesPage,
    });
    registerMenuExtensions();
  }
}

export default PluginBlockReferenceClient;
