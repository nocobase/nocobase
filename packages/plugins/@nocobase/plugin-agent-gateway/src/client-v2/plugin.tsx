/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';
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

    this.pluginSettingsManager.addPageTabItem({
      menuKey: NAMESPACE,
      key: 'nodes',
      title: this.t('Nodes'),
      componentLoader: () => import('./pages/AgentGatewaySettingsPage'),
      sort: 10,
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: NAMESPACE,
      key: 'runs',
      title: this.t('Runs'),
      componentLoader: () => import('./pages/AgentGatewayRunsPage'),
      sort: 20,
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: NAMESPACE,
      key: 'provider-capabilities',
      title: this.t('Provider Capabilities'),
      aclSnippet: 'pm.agent-gateway.nodes',
      componentLoader: () => import('./pages/AgentGatewayProviderCapabilitiesPage'),
      sort: 24,
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: NAMESPACE,
      key: 'audit',
      title: this.t('Audit'),
      aclSnippet: 'pm.agent-gateway.audit',
      hidden: true,
      componentLoader: () => import('./pages/AgentGatewayAuditPage'),
      sort: 25,
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: NAMESPACE,
      key: 'prompt-templates',
      title: this.t('Prompt Templates'),
      componentLoader: () => import('./pages/AgentGatewayPromptTemplatesPage'),
      sort: 30,
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: NAMESPACE,
      key: 'dispatch-bindings',
      title: this.t('Dispatch Bindings'),
      componentLoader: () => import('./pages/AgentGatewayDispatchBindingsPage'),
      sort: 40,
    });
  }
}

export default PluginAgentGatewayClientV2;
