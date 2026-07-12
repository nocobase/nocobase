/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { tval } from '@nocobase/utils/client';

import { AgentGatewayDispatchBindingSelect } from '../client-v2/components/AgentGatewayDispatchBindingSelect';
import { AGENT_GATEWAY_SETTINGS_KEY, AGENT_GATEWAY_SETTINGS_PAGES } from '../client-shared/settings';

export class PluginAgentGatewayClient extends Plugin {
  async load() {
    this.flowEngine.flowSettings.registerComponents({
      AgentGatewayDispatchBindingSelect,
    });

    this.flowEngine.registerModelLoaders({
      AgentGatewayDispatchActionModel: {
        loader: () => import('../client-v2/models/AgentGatewayDispatchActionModel'),
      },
    });

    this.pluginSettingsManager.add(AGENT_GATEWAY_SETTINGS_KEY, {
      icon: 'ApiOutlined',
      title: tval('Agent Gateway', { ns: AGENT_GATEWAY_SETTINGS_KEY }),
      aclSnippet: `pm.${AGENT_GATEWAY_SETTINGS_KEY}`,
    });

    for (const page of AGENT_GATEWAY_SETTINGS_PAGES) {
      this.pluginSettingsManager.add(`${AGENT_GATEWAY_SETTINGS_KEY}.${page.key}`, {
        icon: page.icon,
        title: tval(page.title, { ns: AGENT_GATEWAY_SETTINGS_KEY }),
        aclSnippet: page.aclSnippet,
        componentLoader: page.componentLoader,
        hidden: page.hidden,
        sort: page.sort,
      });
    }
  }
}

export default PluginAgentGatewayClient;
