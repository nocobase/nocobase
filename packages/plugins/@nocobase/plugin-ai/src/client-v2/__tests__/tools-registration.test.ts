/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  pluginAIClientV2BuiltinToolNames,
  pluginAIClientV2BuiltinTools,
  registerPluginAIClientV2BuiltinTools,
} from '../ai-employees/tools';

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

describe('plugin-ai client-v2 tools registration', () => {
  it('keeps v2 builtin tool names aligned with v1 registration', () => {
    expect(pluginAIClientV2BuiltinToolNames).toEqual(V1_REGISTERED_TOOL_NAMES);
  });

  it('registers every builtin tool exactly once', () => {
    const registered: string[] = [];
    registerPluginAIClientV2BuiltinTools({
      registerTools(name) {
        registered.push(name);
      },
    });

    expect(registered).toEqual(V1_REGISTERED_TOOL_NAMES);
    expect(new Set(registered).size).toBe(pluginAIClientV2BuiltinTools.length);
  });

  it('registers v2 UI for tools with v1 custom cards or modals', () => {
    const tools = new Map(pluginAIClientV2BuiltinTools);

    expect(tools.get('defineCollections')?.ui?.card).toBeTruthy();
    expect(tools.get('defineCollections')?.ui?.modal?.Component).toBeTruthy();
    expect(tools.get('aiEmployeeWorkflowTaskOutput')?.ui?.card).toBeTruthy();
    expect(tools.get('writeJSCode')?.ui?.card).toBeTruthy();
    expect(tools.get('patchJSCode')?.ui?.card).toBeTruthy();
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
