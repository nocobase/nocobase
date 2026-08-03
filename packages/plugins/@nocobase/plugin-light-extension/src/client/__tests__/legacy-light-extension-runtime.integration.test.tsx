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
import { installRunJSWorkspaceLegacyClient, legacyRunJSStudioProvider } from '@nocobase/runjs-workspace/client';
import { runJSStudioProvider } from '@nocobase/runjs-workspace/client-v2';
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

import { LIGHT_EXTENSION_ACL_SNIPPET, NAMESPACE } from '../../constants';
import {
  JSActionLightExtensionSourceField,
  JSBlockLightExtensionSourceField,
  JSFieldLightExtensionSourceField,
  JSItemLightExtensionSourceField,
  JSPageLightExtensionSourceField,
} from '../../client-v2/components/JSBlockLightExtensionSourceField';
import PluginJsTemplateClient, {
  JS_TEMPLATE_LEGACY_SETTINGS_KEY,
  JS_TEMPLATE_SETTINGS_KEY,
  PluginLightExtensionClient,
} from '..';

function createLegacyApplication() {
  return new Application({
    plugins: [[PluginFlowEngine, { name: 'flow-engine' }]],
    router: { type: 'memory', initialEntries: ['/admin'] },
  });
}

async function loadLegacyPlugins(app: Application) {
  installRunJSWorkspaceLegacyClient(app.apiClient);
  const jsTemplate = new PluginJsTemplateClient({ name: 'light-extension', packageName: NAMESPACE }, app);

  await jsTemplate.afterAdd();
  await jsTemplate.beforeLoad();
  await jsTemplate.load();

  return jsTemplate;
}

describe('JS Template legacy admin-shell integration', () => {
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

  it('registers the canonical route and hidden legacy route with one page, ACL, and runtime', async () => {
    const firstApp = createLegacyApplication();
    await firstApp.load();
    await loadLegacyPlugins(firstApp);

    const canonicalSettings = firstApp.pluginSettingsManager.get(JS_TEMPLATE_SETTINGS_KEY, false);
    const legacySettings = firstApp.pluginSettingsManager.get(JS_TEMPLATE_LEGACY_SETTINGS_KEY, false);
    expect(canonicalSettings).toMatchObject({
      title: 'JS Templates',
      path: '/admin/settings/js-templates',
      aclSnippet: LIGHT_EXTENSION_ACL_SNIPPET,
    });
    expect(legacySettings).toMatchObject({
      title: 'JS Templates',
      path: '/admin/settings/light-extension',
      aclSnippet: LIGHT_EXTENSION_ACL_SNIPPET,
      hidden: true,
    });
    expect(canonicalSettings?.Component).toBe(legacySettings?.Component);
    const visibleSettingsNames = firstApp.pluginSettingsManager
      .getList(false)
      .filter((settings) => !settings.hidden)
      .map((settings) => settings.name);
    expect(visibleSettingsNames).toContain(JS_TEMPLATE_SETTINGS_KEY);
    expect(visibleSettingsNames).not.toContain(JS_TEMPLATE_LEGACY_SETTINGS_KEY);
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
      '@nocobase/runjs-workspace/legacy-runjs-studio',
    ]);
    expect(RunJSSourceResolverRegistry.getResolvers()).toHaveLength(1);
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(1);

    const firstResolver = RunJSSourceResolverRegistry.getResolver('light-extension');
    const secondApp = createLegacyApplication();
    await secondApp.load();
    const secondJsTemplate = new PluginLightExtensionClient(
      { name: 'light-extension', packageName: NAMESPACE },
      secondApp,
    );

    await secondJsTemplate.beforeLoad();
    expect(RunJSSourceResolverRegistry.getResolver('light-extension')).toBeNull();

    await loadLegacyPlugins(secondApp);
    expect(RunJSSourceResolverRegistry.getResolvers()).toHaveLength(1);
    expect(RunJSSourceResolverRegistry.getResolver('light-extension')).not.toBe(firstResolver);
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(1);
    expect(
      RunJSEditorRegistry.getProviders().filter((provider) => provider.key === 'light-extension-runjs-value'),
    ).toHaveLength(1);
    expect(LegacyRunJSEditorRegistry.getProviders().map((provider) => provider.key)).toEqual([
      '@nocobase/runjs-workspace/legacy-runjs-studio',
    ]);
  });

  it('uses legacy Studio only for flow model steps and preserves workflow fallback across reloads', async () => {
    const inlineProvider: LegacyRunJSEditorProvider = {
      key: 'workflow-inline',
      canHandle: (providerProps) => providerProps.locator?.kind === 'workflow.javascript',
      renderEditor: () => <div>Workflow inline editor</div>,
    };
    const workflowProps: LegacyRunJSEditorProviderRenderProps = {
      locator: { kind: 'workflow.javascript', nodeId: 'node-1' },
      value: { code: 'return 1;', version: 'workflow-js' },
      onChange: vi.fn(),
    };
    const stepProps: LegacyRunJSEditorProviderRenderProps = {
      locator: {
        kind: 'flowModel.step',
        modelUid: 'model-1',
        flowKey: 'jsSettings',
        stepKey: 'runJs',
        paramPath: ['code'],
      },
      value: { code: 'return 1;', version: 'v2' },
      onChange: vi.fn(),
    };
    LegacyRunJSEditorRegistry.registerProvider(inlineProvider);
    expect(LegacyRunJSEditorRegistry.getProvider(workflowProps)).toBe(inlineProvider);
    expect(
      legacyRunJSStudioProvider.canHandle?.({
        ...workflowProps,
        sourceLocator: stepProps.locator,
      }),
    ).toBe(true);
    expect(
      legacyRunJSStudioProvider.canHandle?.({
        ...stepProps,
        sourceLocator: workflowProps.locator,
      }),
    ).toBe(false);

    vi.spyOn(runJSStudioProvider, 'renderEditor').mockImplementation((studioProps) => (
      <button type="button" onClick={() => studioProps.onPersistedChange?.({ code: 'return 2;', version: 'v2' })}>
        Save step source
      </button>
    ));

    const app = createLegacyApplication();
    await app.load();
    const lightExtension = await loadLegacyPlugins(app);
    const studioProvider = LegacyRunJSEditorRegistry.getProvider(stepProps);

    expect(studioProvider?.key).toBe('@nocobase/runjs-workspace/legacy-runjs-studio');
    expect(LegacyRunJSEditorRegistry.getProvider(workflowProps)).toBe(inlineProvider);
    const studio = render(
      <ApplicationContext.Provider value={app}>{studioProvider?.renderEditor(stepProps)}</ApplicationContext.Provider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save step source' }));
    expect(stepProps.onChange).toHaveBeenCalledWith({ code: 'return 2;', version: 'v2' });

    lightExtension.dispose();
    expect(LegacyRunJSEditorRegistry.getProvider(workflowProps)).toBe(inlineProvider);
    expect(LegacyRunJSEditorRegistry.getProvider(stepProps)?.key).toBe('@nocobase/runjs-workspace/legacy-runjs-studio');
    expect(RunJSEditorRegistry.getProviders()).toHaveLength(1);
    expect(RunJSSourceResolverRegistry.getResolvers()).toHaveLength(0);
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(1);
    studio.unmount();
    render(<>{LegacyRunJSEditorRegistry.getProvider(workflowProps)?.renderEditor(workflowProps)}</>);
    expect(screen.getByText('Workflow inline editor')).toBeVisible();

    await lightExtension.load();
    expect(LegacyRunJSEditorRegistry.getProviders().map((provider) => provider.key)).toEqual([
      'workflow-inline',
      '@nocobase/runjs-workspace/legacy-runjs-studio',
    ]);
    expect(
      RunJSEditorRegistry.getProviders().filter(
        (provider) => provider.key === '@nocobase/runjs-workspace/runjs-studio',
      ),
    ).toHaveLength(1);
    expect(RunJSSourceResolverRegistry.getResolvers()).toHaveLength(1);
    expect(LegacyRunJSEditorRegistry.getProvider(workflowProps)).toBe(inlineProvider);
    expect(LegacyRunJSEditorRegistry.getProvider(stepProps)?.key).toBe('@nocobase/runjs-workspace/legacy-runjs-studio');

    lightExtension.dispose();
    expect(LegacyRunJSEditorRegistry.getProvider(workflowProps)).toBe(inlineProvider);
    expect(LegacyRunJSEditorRegistry.getProvider(stepProps)?.key).toBe('@nocobase/runjs-workspace/legacy-runjs-studio');
  });
});
