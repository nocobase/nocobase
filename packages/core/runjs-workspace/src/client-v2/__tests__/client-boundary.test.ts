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

import { RunJSEditorRegistry, RunJSSettingsDescriptorProviderRegistry } from '@nocobase/client-v2';

import { installRunJSWorkspaceClientV2 } from '../plugin';

describe('RunJS workspace client-v2 boundary', () => {
  afterEach(() => {
    RunJSEditorRegistry.clear();
    RunJSSettingsDescriptorProviderRegistry.clear();
  });

  it('installs the core Studio and inline settings provider with identity-safe disposal', () => {
    const api = { request: vi.fn() };
    const disposeFirst = installRunJSWorkspaceClientV2(api);
    const disposeSecond = installRunJSWorkspaceClientV2(api);

    expect(RunJSEditorRegistry.getProviders().map((provider) => provider.key)).toEqual([
      '@nocobase/runjs-workspace/runjs-studio',
    ]);
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders().map((provider) => provider.key)).toEqual([
      '@nocobase/runjs-workspace/inline-settings-descriptor',
    ]);

    disposeFirst();
    expect(RunJSEditorRegistry.getProviders()).toHaveLength(1);
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(1);

    disposeSecond();
    expect(RunJSEditorRegistry.getProviders()).toHaveLength(0);
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(0);
  });

  it('does not import the legacy client or Light Extension domain contracts', () => {
    const clientRoot = path.resolve(__dirname, '..');
    const sources = readSourceFiles(clientRoot)
      .filter((file) => !file.includes(`${path.sep}__tests__${path.sep}`))
      .map((file) => fs.readFileSync(file, 'utf8'))
      .join('\n');

    expect(sources).not.toMatch(/from\s+['"]@nocobase\/client['"]|require\(['"]@nocobase\/client['"]\)/);
    expect(sources).not.toMatch(/LightExtension(?:Repository|Repo|Entry|RuntimeSourceBinding)/);
    expect(sources).not.toContain('@nocobase/plugin-light-extension');
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
