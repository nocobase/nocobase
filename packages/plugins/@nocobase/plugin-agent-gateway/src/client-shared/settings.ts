/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const AGENT_GATEWAY_SETTINGS_KEY = 'agent-gateway';

export interface AgentGatewaySettingsPageDefinition {
  key: string;
  title: string;
  icon: string;
  aclSnippet: string;
  hidden?: boolean;
  sort: number;
  componentLoader: () => Promise<unknown>;
}

export const AGENT_GATEWAY_SETTINGS_PAGES: AgentGatewaySettingsPageDefinition[] = [
  {
    key: 'nodes',
    title: 'Nodes',
    icon: 'ApiOutlined',
    aclSnippet: 'pm.agent-gateway.nodes',
    sort: 10,
    componentLoader: () => import('../client-v2/pages/AgentGatewaySettingsPage'),
  },
  {
    key: 'skills',
    title: 'Skills',
    icon: 'ToolOutlined',
    aclSnippet: 'pm.agent-gateway.skills',
    sort: 15,
    componentLoader: () => import('../client-v2/pages/AgentGatewaySkillsPage'),
  },
  {
    key: 'runs',
    title: 'Runs',
    icon: 'PlayCircleOutlined',
    aclSnippet: 'pm.agent-gateway.runs',
    sort: 20,
    componentLoader: () => import('../client-v2/pages/AgentGatewayRunsPage'),
  },
  {
    key: 'provider-capabilities',
    title: 'Provider Capabilities',
    icon: 'PartitionOutlined',
    aclSnippet: 'pm.agent-gateway.nodes',
    hidden: true,
    sort: 24,
    componentLoader: () => import('../client-v2/pages/AgentGatewayProviderCapabilitiesPage'),
  },
  {
    key: 'task-templates',
    title: 'Task Templates',
    icon: 'ProfileOutlined',
    aclSnippet: 'pm.agent-gateway.task-templates',
    sort: 30,
    componentLoader: () => import('../client-v2/pages/AgentGatewayTaskTemplatesPage'),
  },
  {
    key: 'prompt-templates',
    title: 'Prompt Templates',
    icon: 'FileTextOutlined',
    aclSnippet: 'pm.agent-gateway.prompt-templates',
    hidden: true,
    sort: 40,
    componentLoader: () => import('../client-v2/pages/AgentGatewayPromptTemplatesPage'),
  },
  {
    key: 'dispatch-bindings',
    title: 'Dispatch Bindings',
    icon: 'BranchesOutlined',
    aclSnippet: 'pm.agent-gateway.dispatch-bindings',
    hidden: true,
    sort: 50,
    componentLoader: () => import('../client-v2/pages/AgentGatewayDispatchBindingsPage'),
  },
];
