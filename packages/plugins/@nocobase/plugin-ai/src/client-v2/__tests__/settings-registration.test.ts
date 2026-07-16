/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockClient } from '@nocobase/client-v2';
import { createJSRunnerWithVersion, FlowContext, getRunJSDocFor, setupRunJSContexts } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';
import { AIChatBoxBlockModel, AIChatBoxCoreModel } from '../block/ai-chat-box';
import { AIChatDemoBlockModel } from '../block';
import PluginAIClientV2, {
  registerPluginAIPermissionsTab,
  registerPluginAIRunJSContextContribution,
  registerPluginAISettingsPages,
} from '../plugin';

describe('plugin-ai v2 settings registration', () => {
  it('registers AI settings menu and page tabs', () => {
    const addMenuItem = vi.fn();
    const addPageTabItem = vi.fn();

    registerPluginAISettingsPages(
      {
        addMenuItem,
        addPageTabItem,
      },
      (key) => `t:${key}`,
    );

    expect(addMenuItem).toHaveBeenCalledWith({
      key: 'ai',
      icon: 'TeamOutlined',
      title: 't:AI employees',
      aclSnippet: 'pm.ai',
      isPinned: true,
      sort: 400,
      showTabs: true,
    });
    expect(addPageTabItem).toHaveBeenCalledTimes(4);
    expect(addPageTabItem.mock.calls.map(([item]) => [item.menuKey, item.key, item.aclSnippet])).toEqual([
      ['ai', 'employees', 'pm.ai.employees'],
      ['ai', 'llm-services', 'pm.ai.llm-services'],
      ['ai', 'mcp-settings', 'pm.ai.mcp-settings'],
      ['ai', 'settings', 'pm.ai.settings'],
    ]);
    addPageTabItem.mock.calls.forEach(([item]) => {
      expect(item.componentLoader).toEqual(expect.any(Function));
    });
  });

  it('registers the AI employees ACL permissions tab when ACL v2 exists', () => {
    const addPermissionsTab = vi.fn();
    const get = vi.fn(() => ({
      settingsUI: {
        addPermissionsTab,
      },
    }));

    registerPluginAIPermissionsTab(
      {
        get,
      },
      (key) => `t:${key}`,
    );

    expect(get).toHaveBeenCalledWith(expect.any(Function));
    expect(addPermissionsTab).toHaveBeenCalledWith({
      key: 'ai-employees',
      label: 't:AI employees',
      sort: 30,
      componentLoader: expect.any(Function),
    });
  });

  it('skips the AI employees ACL permissions tab when ACL v2 is absent', () => {
    const get = vi.fn(() => undefined);

    expect(() =>
      registerPluginAIPermissionsTab(
        {
          get,
        },
        (key) => key,
      ),
    ).not.toThrow();
  });

  it('registers v2 work contexts and AI chat box models', async () => {
    const app = createMockClient({ publicPath: '/v/' });

    await app.pm.add(PluginAIClientV2);
    await app.load();

    const plugin = app.pm.get(PluginAIClientV2) as PluginAIClientV2;

    expect(plugin.aiManager.getWorkContext('flow-model')).toBeDefined();
    expect(plugin.aiManager.getWorkContext('datasource')).toBeUndefined();
    const context = app.flowEngine.context as unknown as {
      ai?: {
        triggerTask?: unknown;
        triggerModelTask?: unknown;
        onChatBoxMounted?: unknown;
      };
    };

    expect(context.ai?.triggerTask).toEqual(expect.any(Function));
    expect(context.ai?.triggerModelTask).toEqual(expect.any(Function));
    expect(context.ai?.onChatBoxMounted).toBeUndefined();
    expect(app.flowEngine.getModelClass('AIChatBoxBlockModel')).toBe(AIChatBoxBlockModel);
    expect(app.flowEngine.getModelClass('AIChatBoxCoreModel')).toBe(AIChatBoxCoreModel);
    expect(app.flowEngine.getModelClass('AIChatDemoBlockModel')).toBe(AIChatDemoBlockModel);
  });

  it('registers RunJS docs for ctx.ai.triggerTask and ctx.ai.triggerModelTask', async () => {
    registerPluginAIRunJSContextContribution();
    await setupRunJSContexts();

    const docs = [
      getRunJSDocFor(new FlowContext(), { version: 'v1' }),
      getRunJSDocFor(new FlowContext(), { version: 'v2' }),
    ];

    for (const doc of docs) {
      expect(doc?.properties?.ai?.properties?.triggerTask).toBeDefined();
      expect(doc?.properties?.ai?.properties?.triggerModelTask).toBeDefined();
      const registerTool = doc?.properties?.ai?.properties?.tools?.properties?.register;
      expect(registerTool).toBeDefined();
      expect(registerTool?.detail).toContain("permission?: 'ASK' | 'ALLOW'");
      expect(registerTool?.completion?.insertText).toContain("permission: 'ASK'");
    }
  });

  it('exposes ctx.ai and frontend tools whenever a JS block RunJS context is created', async () => {
    registerPluginAIRunJSContextContribution();
    await setupRunJSContexts();

    for (const version of ['v1', 'v2'] as const) {
      const triggerTask = vi.fn();
      const triggerModelTask = vi.fn();
      const clear = vi.fn();
      const register = vi.fn();
      const engineContext = new FlowContext();
      engineContext.defineProperty('app', {
        value: {
          pm: {
            get: () => ({ aiManager: { frontendTools: { clear, register } } }),
          },
        },
      });
      engineContext.defineProperty('ai', {
        value: {
          triggerTask,
          triggerModelTask,
        },
      });
      const ctx = new FlowContext();
      ctx.addDelegate(engineContext);
      ctx.defineProperty('model', { value: { uid: 'block-1', constructor: { name: 'JSBlockModel' } } });

      for (let run = 0; run < 2; run++) {
        const runner = createJSRunnerWithVersion.call(ctx, { version });
        const result = await runner.run(`
          ctx.ai.tools.register({ name: 'read_dashboard', description: 'Read dashboard', execute() {} });
          ctx.ai.triggerTask({ aiEmployee: 'nathan', tasks: [], open: true });
          ctx.ai.triggerModelTask('flow-model-uid', 0);
          return typeof ctx.ai.tools.register === 'function';
        `);

        expect(result?.success).toBe(true);
        expect(result?.value).toBe(true);
      }

      expect(clear).toHaveBeenCalledTimes(2);
      expect(clear).toHaveBeenCalledWith('block-1');
      expect(register).toHaveBeenCalledTimes(2);
      expect(register).toHaveBeenCalledWith(
        'block-1',
        expect.objectContaining({ name: 'read_dashboard', description: 'Read dashboard' }),
      );
      expect(triggerTask).toHaveBeenCalledWith({ aiEmployee: 'nathan', tasks: [], open: true });
      expect(triggerModelTask).toHaveBeenCalledWith('flow-model-uid', 0);
    }
  });
});
