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

const AGENT_GATEWAY_SETTINGS_KEY = 'agent-gateway';

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

    this.pluginSettingsManager.add(`${AGENT_GATEWAY_SETTINGS_KEY}.nodes`, {
      icon: 'ApiOutlined',
      title: tval('Nodes', { ns: AGENT_GATEWAY_SETTINGS_KEY }),
      aclSnippet: `pm.${AGENT_GATEWAY_SETTINGS_KEY}.nodes`,
      componentLoader: () => import('../client-v2/pages/AgentGatewaySettingsPage'),
      sort: 10,
    });

    this.pluginSettingsManager.add(`${AGENT_GATEWAY_SETTINGS_KEY}.runs`, {
      icon: 'PlayCircleOutlined',
      title: tval('Runs', { ns: AGENT_GATEWAY_SETTINGS_KEY }),
      aclSnippet: `pm.${AGENT_GATEWAY_SETTINGS_KEY}.runs`,
      componentLoader: () => import('../client-v2/pages/AgentGatewayRunsPage'),
      sort: 20,
    });

    this.pluginSettingsManager.add(`${AGENT_GATEWAY_SETTINGS_KEY}.provider-capabilities`, {
      icon: 'PartitionOutlined',
      title: tval('Provider Capabilities', { ns: AGENT_GATEWAY_SETTINGS_KEY }),
      aclSnippet: `pm.${AGENT_GATEWAY_SETTINGS_KEY}.nodes`,
      componentLoader: () => import('../client-v2/pages/AgentGatewayProviderCapabilitiesPage'),
      hidden: true,
      sort: 24,
    });

    this.pluginSettingsManager.add(`${AGENT_GATEWAY_SETTINGS_KEY}.task-templates`, {
      icon: 'ProfileOutlined',
      title: tval('Task Templates', { ns: AGENT_GATEWAY_SETTINGS_KEY }),
      aclSnippet: `pm.${AGENT_GATEWAY_SETTINGS_KEY}`,
      componentLoader: () => import('../client-v2/pages/AgentGatewayTaskTemplatesPage'),
      sort: 30,
    });

    this.pluginSettingsManager.add(`${AGENT_GATEWAY_SETTINGS_KEY}.prompt-templates`, {
      icon: 'FileTextOutlined',
      title: tval('Prompt Templates', { ns: AGENT_GATEWAY_SETTINGS_KEY }),
      aclSnippet: `pm.${AGENT_GATEWAY_SETTINGS_KEY}.prompt-templates`,
      componentLoader: () => import('../client-v2/pages/AgentGatewayPromptTemplatesPage'),
      hidden: true,
      sort: 40,
    });

    this.pluginSettingsManager.add(`${AGENT_GATEWAY_SETTINGS_KEY}.dispatch-bindings`, {
      icon: 'BranchesOutlined',
      title: tval('Dispatch Bindings', { ns: AGENT_GATEWAY_SETTINGS_KEY }),
      aclSnippet: `pm.${AGENT_GATEWAY_SETTINGS_KEY}.dispatch-bindings`,
      componentLoader: () => import('../client-v2/pages/AgentGatewayDispatchBindingsPage'),
      hidden: true,
      sort: 50,
    });
  }
}

export default PluginAgentGatewayClient;
