/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'fs';
import path from 'path';

import {
  clearRunJSRegistryHosts,
  clearRunJSRuntimeHosts,
  getRunJSRegistryHost,
  getRunJSRuntimeHost,
  type Application,
} from '@nocobase/client-v2';

import {
  installRunJSWorkspaceAuthoringClientV2,
  installRunJSWorkspaceClientV2,
  installRunJSWorkspaceRuntimeClientV2,
} from '../plugin';
import { RunJSEditorRegistry, RunJSSettingsDescriptorProviderRegistry } from '../runJSRegistryHost';

describe('RunJS workspace client-v2 boundary', () => {
  afterEach(() => {
    RunJSEditorRegistry.clear();
    RunJSSettingsDescriptorProviderRegistry.clear();
    clearRunJSRegistryHosts();
    clearRunJSRuntimeHosts();
  });

  it('installs the resident registry and runtime hosts without authoring providers', () => {
    const dispose = installRunJSWorkspaceRuntimeClientV2();

    expect(getRunJSRegistryHost()).toBeDefined();
    expect(() => getRunJSRuntimeHost()).not.toThrow();
    expect(RunJSEditorRegistry.getProviders()).toHaveLength(0);
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(0);

    dispose();
    expect(getRunJSRegistryHost()).toBeUndefined();
    expect(() => getRunJSRuntimeHost()).toThrow('RunJS client runtime is not installed');
  });

  it('installs Studio and inline settings authoring with identity-safe disposal', () => {
    const app = { apiClient: { request: vi.fn() } } as unknown as Application;
    const disposeRuntime = installRunJSWorkspaceRuntimeClientV2();
    const disposeFirst = installRunJSWorkspaceAuthoringClientV2(app);
    const disposeSecond = installRunJSWorkspaceAuthoringClientV2(app);

    expect(RunJSEditorRegistry.getProviders().map((provider) => provider.key)).toEqual([
      '@nocobase/runjs/workspace/runjs-studio',
    ]);
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders().map((provider) => provider.key)).toEqual([
      '@nocobase/runjs/workspace/inline-settings-descriptor',
    ]);

    disposeFirst();
    expect(RunJSEditorRegistry.getProviders()).toHaveLength(1);
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(1);

    disposeSecond();
    expect(RunJSEditorRegistry.getProviders()).toHaveLength(0);
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(0);
    disposeRuntime();
  });

  it('keeps the compatibility installer identity-safe across overlapping lifecycles', () => {
    const app = { apiClient: { request: vi.fn() } } as unknown as Application;
    const disposeFirst = installRunJSWorkspaceClientV2(app);
    const disposeSecond = installRunJSWorkspaceClientV2(app);

    disposeFirst();
    expect(getRunJSRegistryHost()).toBeDefined();
    expect(() => getRunJSRuntimeHost()).not.toThrow();
    expect(RunJSEditorRegistry.getProviders()).toHaveLength(1);
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(1);

    disposeSecond();
    expect(getRunJSRegistryHost()).toBeUndefined();
    expect(() => getRunJSRuntimeHost()).toThrow('RunJS client runtime is not installed');
    expect(RunJSEditorRegistry.getProviders()).toHaveLength(0);
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(0);
  });

  it('does not import the legacy client or JS Template domain contracts', () => {
    const clientRoot = path.resolve(__dirname, '..');
    const sources = readSourceFiles(clientRoot)
      .filter((file) => !file.includes(`${path.sep}__tests__${path.sep}`))
      .map((file) => fs.readFileSync(file, 'utf8'))
      .join('\n');

    expect(sources).not.toMatch(/from\s+['"]@nocobase\/client['"]|require\(['"]@nocobase\/client['"]\)/);
    expect(sources).not.toMatch(/JsTemplate(?:Repository|Repo|Entry|RuntimeSourceBinding)/);
    expect(sources).not.toContain('@nocobase/plugin-js-template');
  });
});

function readSourceFiles(root: string): string[] {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) {
      return readSourceFiles(target);
    }
    return /\.tsx?$/.test(entry.name) ? [target] : [];
  });
}
