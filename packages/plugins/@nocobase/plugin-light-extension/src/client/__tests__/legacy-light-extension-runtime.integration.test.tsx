/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import {
  Application,
  ApplicationContext,
  LegacyRunJSEditorRegistry,
  type LegacyRunJSEditorProvider,
  type LegacyRunJSEditorProviderRenderProps,
} from '@nocobase/client';
import React from 'react';
import {
  JS_ACTION_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_BLOCK_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_FIELD_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_ITEM_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_PAGE_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  PluginFlowEngine,
  RunJSEditorRegistry,
  RunJSSettingsDescriptorProviderRegistry,
  RunJSSourceResolverRegistry,
  clearActionGroupMenuItemProviders,
  clearBlockGridSelectSceneAddBlockProviders,
  clearFieldMenuItemProviders,
} from '@nocobase/client-v2';
import { runJSStudioProvider } from '../../client-v2/vsc-file/public-api';

import { LIGHT_EXTENSION_ACL_SNIPPET, LIGHT_EXTENSION_SETTINGS_KEY, NAMESPACE } from '../../constants';
import {
  JSActionLightExtensionSourceField,
  JSBlockLightExtensionSourceField,
  JSFieldLightExtensionSourceField,
  JSItemLightExtensionSourceField,
  JSPageLightExtensionSourceField,
} from '../../client-v2/components/JSBlockLightExtensionSourceField';
import PluginLightExtensionClient from '..';

function createLegacyApplication() {
  return new Application({
    plugins: [[PluginFlowEngine, { name: 'flow-engine' }]],
    router: { type: 'memory', initialEntries: ['/admin'] },
  });
}

async function loadLegacyPlugins(app: Application) {
  const lightExtension = new PluginLightExtensionClient({ name: 'light-extension', packageName: NAMESPACE }, app);

  await lightExtension.afterAdd();
  await lightExtension.beforeLoad();
  await lightExtension.load();

  return lightExtension;
}

describe('legacy Light Extension runtime integration', () => {
  afterEach(() => {
    LegacyRunJSEditorRegistry.clear();
    RunJSEditorRegistry.clear();
    RunJSSettingsDescriptorProviderRegistry.clear();
    RunJSSourceResolverRegistry.clear();
    clearBlockGridSelectSceneAddBlockProviders();
    clearActionGroupMenuItemProviders();
    clearFieldMenuItemProviders();
    vi.restoreAllMocks();
  });

  it('hosts both Studio providers in Light Extension and replaces stale global registrations on reload', async () => {
    const firstApp = createLegacyApplication();
    await firstApp.load();
    await loadLegacyPlugins(firstApp);

    expect(firstApp.pluginSettingsManager.get(LIGHT_EXTENSION_SETTINGS_KEY, false)).toMatchObject({
      title: 'Light extensions',
      aclSnippet: LIGHT_EXTENSION_ACL_SNIPPET,
    });
    expect(firstApp.flowEngine.flowSettings.components).toMatchObject({
      [JS_ACTION_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: JSActionLightExtensionSourceField,
      [JS_BLOCK_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: JSBlockLightExtensionSourceField,
      [JS_FIELD_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: JSFieldLightExtensionSourceField,
      [JS_ITEM_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: JSItemLightExtensionSourceField,
      [JS_PAGE_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: JSPageLightExtensionSourceField,
    });
    expect(RunJSEditorRegistry.getProviders()).toContainEqual(runJSStudioProvider);
    expect(RunJSEditorRegistry.getProviders().map((provider) => provider.key)).toContain('light-extension-runjs-value');
    expect(LegacyRunJSEditorRegistry.getProviders().map((provider) => provider.key)).toEqual([
      '@nocobase/plugin-vsc-file/legacy-runjs-studio',
    ]);
    expect(RunJSSourceResolverRegistry.getResolvers()).toHaveLength(1);
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(1);

    const firstResolver = RunJSSourceResolverRegistry.getResolver('light-extension');
    const secondApp = createLegacyApplication();
    await secondApp.load();
    const secondLightExtension = new PluginLightExtensionClient(
      { name: 'light-extension', packageName: NAMESPACE },
      secondApp,
    );

    await secondLightExtension.beforeLoad();
    expect(RunJSSourceResolverRegistry.getResolver('light-extension')).toBeNull();

    await loadLegacyPlugins(secondApp);
    expect(RunJSSourceResolverRegistry.getResolvers()).toHaveLength(1);
    expect(RunJSSourceResolverRegistry.getResolver('light-extension')).not.toBe(firstResolver);
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(1);
    expect(
      RunJSEditorRegistry.getProviders().filter((provider) => provider.key === 'light-extension-runjs-value'),
    ).toHaveLength(1);
    expect(LegacyRunJSEditorRegistry.getProviders().map((provider) => provider.key)).toEqual([
      '@nocobase/plugin-vsc-file/legacy-runjs-studio',
    ]);
  });

  it('saves through the legacy Studio and restores the inline editor across disable and re-enable', async () => {
    const inlineProvider: LegacyRunJSEditorProvider = {
      key: 'workflow-inline',
      renderEditor: () => <div>Workflow inline editor</div>,
    };
    const props: LegacyRunJSEditorProviderRenderProps = {
      locator: { kind: 'workflow.javascript', nodeId: 'node-1' },
      value: { code: 'return 1;', version: 'workflow-js' },
      onChange: vi.fn(),
    };
    LegacyRunJSEditorRegistry.registerProvider(inlineProvider);
    expect(LegacyRunJSEditorRegistry.getProvider(props)).toBe(inlineProvider);

    vi.spyOn(runJSStudioProvider, 'renderEditor').mockImplementation((studioProps) => (
      <button
        type="button"
        onClick={() => studioProps.onPersistedChange?.({ code: 'return 2;', version: 'workflow-js' })}
      >
        Save workflow source
      </button>
    ));

    const app = createLegacyApplication();
    await app.load();
    const lightExtension = await loadLegacyPlugins(app);
    const studioProvider = LegacyRunJSEditorRegistry.getProvider(props);

    expect(studioProvider?.key).toBe('@nocobase/plugin-vsc-file/legacy-runjs-studio');
    const studio = render(
      <ApplicationContext.Provider value={app}>{studioProvider?.renderEditor(props)}</ApplicationContext.Provider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save workflow source' }));
    expect(props.onChange).toHaveBeenCalledWith({ code: 'return 2;', version: 'workflow-js' });

    lightExtension.dispose();
    expect(LegacyRunJSEditorRegistry.getProvider(props)).toBe(inlineProvider);
    expect(RunJSEditorRegistry.getProviders()).toHaveLength(0);
    expect(RunJSSourceResolverRegistry.getResolvers()).toHaveLength(0);
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(0);
    studio.unmount();
    render(<>{LegacyRunJSEditorRegistry.getProvider(props)?.renderEditor(props)}</>);
    expect(screen.getByText('Workflow inline editor')).toBeVisible();

    await lightExtension.load();
    expect(LegacyRunJSEditorRegistry.getProviders().map((provider) => provider.key)).toEqual([
      'workflow-inline',
      '@nocobase/plugin-vsc-file/legacy-runjs-studio',
    ]);
    expect(
      RunJSEditorRegistry.getProviders().filter(
        (provider) => provider.key === '@nocobase/plugin-vsc-file/runjs-studio',
      ),
    ).toHaveLength(1);
    expect(RunJSSourceResolverRegistry.getResolvers()).toHaveLength(1);
    expect(LegacyRunJSEditorRegistry.getProvider(props)?.key).toBe('@nocobase/plugin-vsc-file/legacy-runjs-studio');

    lightExtension.dispose();
    expect(LegacyRunJSEditorRegistry.getProvider(props)).toBe(inlineProvider);
  });
});
