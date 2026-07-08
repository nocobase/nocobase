/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  createMockClient,
  JS_ACTION_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_ACTION_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
  JS_BLOCK_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_BLOCK_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
} from '@nocobase/client-v2';
import { RunJSSourceResolverRegistry, registerBlockGridSelectSceneAddBlockProvider } from '@nocobase/client-v2';
import { afterEach, vi } from 'vitest';

import { LIGHT_EXTENSION_ACL_SNIPPET, LIGHT_EXTENSION_SETTINGS_KEY, NAMESPACE } from '../../constants';
import PluginLightExtensionClientV2 from '../plugin';

vi.mock('@nocobase/client-v2', async () => {
  const actual = await vi.importActual<typeof import('@nocobase/client-v2')>('@nocobase/client-v2');
  return {
    ...actual,
    registerBlockGridSelectSceneAddBlockProvider: vi.fn(() => vi.fn()),
  };
});

describe('PluginLightExtensionClientV2', () => {
  afterEach(() => {
    RunJSSourceResolverRegistry.clear();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('registers light extension settings pages', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const app = createMockClient({
      plugins: [
        [
          PluginLightExtensionClientV2,
          {
            name: 'light-extension',
            packageName: NAMESPACE,
          },
        ],
      ],
    });

    await app.load();

    expect(app.pluginSettingsManager.get(LIGHT_EXTENSION_SETTINGS_KEY, false)).toMatchObject({
      key: LIGHT_EXTENSION_SETTINGS_KEY,
      title: 'Light extensions',
      aclSnippet: LIGHT_EXTENSION_ACL_SNIPPET,
      showTabs: false,
    });
    expect(app.pluginSettingsManager.get(`${LIGHT_EXTENSION_SETTINGS_KEY}.index`, false)).toMatchObject({
      menuKey: LIGHT_EXTENSION_SETTINGS_KEY,
      pageKey: 'index',
      componentLoader: expect.any(Function),
      aclSnippet: LIGHT_EXTENSION_ACL_SNIPPET,
    });
    expect(app.pluginSettingsManager.get(`${LIGHT_EXTENSION_SETTINGS_KEY}.source`, false)).toBeNull();
    expect(app.pluginSettingsManager.get(`${LIGHT_EXTENSION_SETTINGS_KEY}.entries`, false)).toBeNull();
    expect(app.pluginSettingsManager.get(`${LIGHT_EXTENSION_SETTINGS_KEY}.publications`, false)).toBeNull();
    expect(app.pluginSettingsManager.get(`${LIGHT_EXTENSION_SETTINGS_KEY}.references`, false)).toBeNull();
    expect(app.flowEngine.flowSettings.components).toMatchObject({
      [JS_ACTION_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: expect.any(Function),
      [JS_ACTION_LIGHT_EXTENSION_SETTINGS_STEP_FIELD]: expect.any(Function),
      [JS_BLOCK_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: expect.any(Function),
      [JS_BLOCK_LIGHT_EXTENSION_SETTINGS_STEP_FIELD]: expect.any(Function),
      RepoEntryPublicationSelector: expect.any(Function),
      SettingsAutoForm: expect.any(Function),
      VersionPolicyField: expect.any(Function),
    });
    expect(warn.mock.calls.flat().join('\n')).not.toContain('JSBlockLightExtensionSourceField');
    expect(RunJSSourceResolverRegistry.getResolver('light-extension')).toBeTruthy();
    expect(registerBlockGridSelectSceneAddBlockProvider).toHaveBeenCalledWith(
      'light-extension-js-blocks',
      expect.any(Function),
    );
  });

  it('cleans previous global registrations before loading a new instance', async () => {
    const app = createMockClient({
      plugins: [
        [
          PluginLightExtensionClientV2,
          {
            name: 'light-extension',
            packageName: NAMESPACE,
          },
        ],
      ],
    });

    await app.load();
    const firstProviderDisposer = vi.mocked(registerBlockGridSelectSceneAddBlockProvider).mock.results[0].value;
    const firstResolver = RunJSSourceResolverRegistry.getResolver('light-extension');

    const nextApp = createMockClient({
      plugins: [
        [
          PluginLightExtensionClientV2,
          {
            name: 'light-extension',
            packageName: NAMESPACE,
          },
        ],
      ],
    });

    await nextApp.load();

    expect(firstProviderDisposer).toHaveBeenCalledTimes(1);
    expect(RunJSSourceResolverRegistry.getResolvers()).toHaveLength(1);
    expect(RunJSSourceResolverRegistry.getResolver('light-extension')).toBeTruthy();
    expect(RunJSSourceResolverRegistry.getResolver('light-extension')).not.toBe(firstResolver);
  });
});
