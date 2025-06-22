/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// @ts-ignore
import { Plugin } from '@nocobase/client';
import { LightComponentsManagement } from './components/LightComponentsManagement';
import { LightComponentConfigPage } from './components/LightComponentConfigPage';
import { LightModel } from './models/LightModel';
import { LightComConfigPageModel } from './models/LightComConfigPageModel';
import { LightComponentBlock } from './components/LightComponentBlock';

// @ts-ignore
import pkg from '../../package.json';
import { tStr } from './locale';

export class PluginLightComponentsClient extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    this.flowEngine.registerModels({ LightModel, LightComConfigPageModel });

    this.app.addComponents({
      LightComponentBlock,
      LightComponentConfigPage,
    });

    // Add plugin settings page
    this.app.pluginSettingsManager.add('light-components', {
      title: tStr('Light Components'),
      icon: 'AppstoreAddOutlined',
      Component: LightComponentsManagement,
      aclSnippet: 'pm.light-components',
    });

    // Add configuration page route
    this.app.pluginSettingsManager.add(`light-components/configure/:key`, {
      title: false,
      isTopLevel: false,
      Component: LightComponentConfigPage,
    });
  }
}

export default PluginLightComponentsClient;
