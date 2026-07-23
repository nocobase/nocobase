/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  pluginAIClientV2BuiltinToolNames,
  pluginAIClientV2BuiltinTools,
  registerPluginAIClientV2BuiltinTools,
} from '../ai-employees/tools';
import { registerWorkspaceAuthoringSurfaceCleanup } from '../plugin';

const V1_REGISTERED_TOOL_NAMES = [
  'switchModes',
  'runQuery',
  'defineCollections',
  'formFiller',
  'chartGenerator',
  'businessReportGenerator',
  'listCodeSnippet',
  'getCodeSnippet',
  'suggestions',
  'dispatch-sub-agent-task',
  'aiEmployeeWorkflowTaskOutput',
  'getContextApis',
  'getContextEnvs',
  'getContextVars',
  'readJSCode',
  'writeJSCode',
  'patchJSCode',
  'lintAndTestJS',
];

const V2_ONLY_TOOL_NAMES = ['loadFrontendTool', 'executeFrontendTool'];

describe('plugin-ai client-v2 tools registration', () => {
  it('keeps shared tool names aligned with v1 and registers v2-only tools afterwards', () => {
    expect(pluginAIClientV2BuiltinToolNames).toEqual([...V1_REGISTERED_TOOL_NAMES, ...V2_ONLY_TOOL_NAMES]);
  });

  it('registers every builtin tool exactly once', () => {
    const registered: string[] = [];
    registerPluginAIClientV2BuiltinTools({
      registerTools(name) {
        registered.push(name);
      },
    });

    expect(registered).toEqual([...V1_REGISTERED_TOOL_NAMES, ...V2_ONLY_TOOL_NAMES]);
    expect(new Set(registered).size).toBe(pluginAIClientV2BuiltinTools.length);
  });

  it('loads and executes registered frontend tools through the AI plugin registry', async () => {
    const getManifest = vi.fn().mockReturnValue({ id: 'block-1:read_dashboard' });
    const execute = vi.fn().mockResolvedValue({ refreshed: true });
    const app = {
      pm: {
        get: () => ({ aiManager: { frontendTools: { getManifest, execute } } }),
      },
    };
    const tools = new Map(pluginAIClientV2BuiltinTools);

    await expect(tools.get('loadFrontendTool')?.invoke?.(app, { toolId: 'block-1:read_dashboard' })).resolves.toEqual({
      id: 'block-1:read_dashboard',
    });
    await expect(
      tools.get('executeFrontendTool')?.invoke?.(app, {
        toolId: 'block-1:read_dashboard',
        args: { refresh: true },
      }),
    ).resolves.toEqual({ refreshed: true });
    expect(execute).toHaveBeenCalledWith('block-1:read_dashboard', { refresh: true });
  });

  it('registers v2 UI for tools with v1 custom cards or modals', () => {
    const tools = new Map(pluginAIClientV2BuiltinTools);

    expect(tools.get('defineCollections')?.ui?.card).toBeTruthy();
    expect(tools.get('defineCollections')?.ui?.modal?.Component).toBeTruthy();
    expect(tools.get('aiEmployeeWorkflowTaskOutput')?.ui?.card).toBeTruthy();
    expect(tools.get('writeJSCode')?.ui?.card).toBeTruthy();
    expect(tools.get('patchJSCode')?.ui?.card).toBeTruthy();
    expect(tools.get('executeFrontendTool')?.ui?.card).toBeTruthy();
  });

  it('clears only the unregistered workspace frontend tool closures', () => {
    let listener: ((event: { type: string; surfaceId: string }) => void) | undefined;
    const unsubscribe = vi.fn();
    const clear = vi.fn();
    const dispose = registerWorkspaceAuthoringSurfaceCleanup(
      {
        subscribe(nextListener) {
          listener = nextListener;
          return unsubscribe;
        },
      },
      { clear },
    );

    listener?.({ type: 'activate', surfaceId: 'workspace-a' });
    listener?.({ type: 'unregister', surfaceId: 'workspace-a' });

    expect(clear).toHaveBeenCalledTimes(1);
    expect(clear).toHaveBeenCalledWith('workspace-a');
    dispose();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('does not statically import heavy modal UI from the tools registry', () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        'packages',
        'plugins',
        '@nocobase',
        'plugin-ai',
        'src',
        'client-v2',
        'ai-employees',
        'tools',
        'index.ts',
      ),
      'utf8',
    );

    expect(source).not.toMatch(/from ['"]\.\/BusinessReportModal['"]/);
    expect(source).not.toMatch(/from ['"]\.\/DataModelingModal['"]/);
  });
});
