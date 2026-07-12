/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';
import { AGENT_GATEWAY_SETTINGS_PAGES } from '../client-shared/settings';
import { NAMESPACE } from './locale';
import { AgentGatewayDispatchBindingSelect } from './components/AgentGatewayDispatchBindingSelect';

export class PluginAgentGatewayClientV2 extends Plugin {
  async load() {
    this.flowEngine.flowSettings.registerComponents({
      AgentGatewayDispatchBindingSelect,
    });

    this.flowEngine.registerModelLoaders({
      AgentGatewayDispatchActionModel: {
        loader: () => import('./models/AgentGatewayDispatchActionModel'),
      },
    });

    this.pluginSettingsManager.addMenuItem({
      key: NAMESPACE,
      title: this.t('Agent Gateway'),
      icon: 'ApiOutlined',
    });

    for (const page of AGENT_GATEWAY_SETTINGS_PAGES) {
      this.pluginSettingsManager.addPageTabItem({
        menuKey: NAMESPACE,
        key: page.key,
        title: this.t(page.title),
        aclSnippet: page.aclSnippet,
        hidden: page.hidden,
        componentLoader: page.componentLoader,
        sort: page.sort,
      });
    }
  }
}

export default PluginAgentGatewayClientV2;
