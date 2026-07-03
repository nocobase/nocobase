/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application } from '@nocobase/client';
import { describe, expect, it, vi } from 'vitest';

import PluginAgentGatewayClient from '../plugin';

describe('PluginAgentGatewayClient', () => {
  it('registers Agent Gateway settings in the legacy client', async () => {
    const app = new Application({
      plugins: [[PluginAgentGatewayClient, { packageName: '@nocobase/plugin-agent-gateway' }]],
    });
    const addSetting = vi.spyOn(app.pluginSettingsManager, 'add');
    const registerComponents = vi.spyOn(app.flowEngine.flowSettings, 'registerComponents');
    const registerModelLoaders = vi.spyOn(app.flowEngine, 'registerModelLoaders');

    await app.load();

    expect(registerComponents).toHaveBeenCalledWith({
      AgentGatewayDispatchBindingSelect: expect.any(Function),
    });
    expect(registerModelLoaders).toHaveBeenCalledWith({
      AgentGatewayDispatchActionModel: {
        loader: expect.any(Function),
      },
    });
    expect(addSetting).toHaveBeenCalledWith(
      'agent-gateway',
      expect.objectContaining({
        icon: 'ApiOutlined',
        aclSnippet: 'pm.agent-gateway',
      }),
    );
    expect(addSetting).toHaveBeenCalledWith(
      'agent-gateway.nodes',
      expect.objectContaining({
        aclSnippet: 'pm.agent-gateway.nodes',
        componentLoader: expect.any(Function),
      }),
    );
    expect(addSetting).toHaveBeenCalledWith(
      'agent-gateway.runs',
      expect.objectContaining({
        aclSnippet: 'pm.agent-gateway.runs',
        componentLoader: expect.any(Function),
      }),
    );
    expect(addSetting).toHaveBeenCalledWith(
      'agent-gateway.audit',
      expect.objectContaining({
        aclSnippet: 'pm.agent-gateway.audit',
        componentLoader: expect.any(Function),
        hidden: true,
      }),
    );
    expect(addSetting).toHaveBeenCalledWith(
      'agent-gateway.prompt-templates',
      expect.objectContaining({
        aclSnippet: 'pm.agent-gateway.prompt-templates',
        componentLoader: expect.any(Function),
      }),
    );
    expect(addSetting).toHaveBeenCalledWith(
      'agent-gateway.dispatch-bindings',
      expect.objectContaining({
        aclSnippet: 'pm.agent-gateway.dispatch-bindings',
        componentLoader: expect.any(Function),
      }),
    );

    expect(app.pluginSettingsManager.getRoutePath('agent-gateway.nodes')).toBe('/admin/settings/agent-gateway/nodes');
    expect(app.pluginSettingsManager.getRoutePath('agent-gateway.runs')).toBe('/admin/settings/agent-gateway/runs');
    expect(app.pluginSettingsManager.getRoutePath('agent-gateway.audit')).toBe('/admin/settings/agent-gateway/audit');
    expect(app.pluginSettingsManager.getRoutePath('agent-gateway.prompt-templates')).toBe(
      '/admin/settings/agent-gateway/prompt-templates',
    );
    expect(app.pluginSettingsManager.getRoutePath('agent-gateway.dispatch-bindings')).toBe(
      '/admin/settings/agent-gateway/dispatch-bindings',
    );
    expect(app.pluginSettingsManager.get('agent-gateway')?.children?.map((item) => item.name)).toEqual([
      'agent-gateway.nodes',
      'agent-gateway.runs',
      'agent-gateway.audit',
      'agent-gateway.prompt-templates',
      'agent-gateway.dispatch-bindings',
    ]);
  });
});
