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
  JS_ACTION_JS_TEMPLATE_FULL_SOURCE_FIELD,
  JS_BLOCK_JS_TEMPLATE_FULL_SOURCE_FIELD,
  JS_FIELD_JS_TEMPLATE_FULL_SOURCE_FIELD,
  JS_ITEM_JS_TEMPLATE_FULL_SOURCE_FIELD,
  PluginFlowEngine,
  RunJSEditorRegistry,
  RunJSSettingsDescriptorProviderRegistry,
  RunJSSourceResolverRegistry,
  clearActionGroupMenuItemProviders,
  clearBlockGridSelectSceneAddBlockProviders,
  clearFieldMenuItemProviders,
  clearRunJSRegistryHosts,
  clearRunJSRuntimeHosts,
} from '@nocobase/client-v2';
import PluginFlowEngineClient from '@nocobase/plugin-flow-engine/client';

import { JS_TEMPLATE_ACL_SNIPPET, JS_TEMPLATE_SETTINGS_KEY, NAMESPACE } from '../../constants';
import {
  JSActionJsTemplateSourceField,
  JSBlockJsTemplateSourceField,
  JSFieldJsTemplateSourceField,
  JSItemJsTemplateSourceField,
} from '../../client-v2/components/JSBlockJsTemplateSourceField';
import PluginJsTemplateClient from '..';
import { legacyRunJSStudioProvider } from '../runjs-studio';
import { runJSStudioProvider } from '../../client-v2/runjs-studio';

function createLegacyApplication() {
  return new Application({
    plugins: [[PluginFlowEngine, { name: 'flow-engine' }]],
    router: { type: 'memory', initialEntries: ['/admin'] },
  });
}

async function loadLegacyPlugins(app: Application) {
  const flowEngine = new PluginFlowEngineClient({ name: 'plugin-flow-engine' }, app);
  await flowEngine.load();
  const jsTemplate = new PluginJsTemplateClient({ name: 'js-template', packageName: NAMESPACE }, app);

  await jsTemplate.afterAdd();
  await jsTemplate.beforeLoad();
  await jsTemplate.load();

  return { flowEngine, jsTemplate };
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
    clearRunJSRegistryHosts();
    clearRunJSRuntimeHosts();
    vi.restoreAllMocks();
  });

  it('registers the canonical settings route with ACL and runtime', async () => {
    const firstApp = createLegacyApplication();
    await firstApp.load();
    const firstPlugins = await loadLegacyPlugins(firstApp);

    const canonicalSettings = firstApp.pluginSettingsManager.get(JS_TEMPLATE_SETTINGS_KEY, false);
    expect(canonicalSettings).toMatchObject({
      title: 'JS Templates',
      path: '/admin/settings/js-templates',
      aclSnippet: JS_TEMPLATE_ACL_SNIPPET,
    });
    const visibleSettingsNames = firstApp.pluginSettingsManager
      .getList(false)
      .filter((settings) => !settings.hidden)
      .map((settings) => settings.name);
    expect(visibleSettingsNames).toContain(JS_TEMPLATE_SETTINGS_KEY);
    expect(firstApp.flowEngine.flowSettings.components).toMatchObject({
      [JS_ACTION_JS_TEMPLATE_FULL_SOURCE_FIELD]: JSActionJsTemplateSourceField,
      [JS_BLOCK_JS_TEMPLATE_FULL_SOURCE_FIELD]: JSBlockJsTemplateSourceField,
      [JS_FIELD_JS_TEMPLATE_FULL_SOURCE_FIELD]: JSFieldJsTemplateSourceField,
      [JS_ITEM_JS_TEMPLATE_FULL_SOURCE_FIELD]: JSItemJsTemplateSourceField,
    });
    expect(RunJSEditorRegistry.getProviders()).toContainEqual(runJSStudioProvider);
    expect(RunJSEditorRegistry.getProviders().map((provider) => provider.key)).toContain('js-template-runjs-value');
    expect(LegacyRunJSEditorRegistry.getProviders().map((provider) => provider.key)).toEqual([
      '@nocobase/runjs/workspace/legacy-runjs-studio',
    ]);
    expect(RunJSSourceResolverRegistry.getResolvers()).toHaveLength(1);
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(1);

    const firstResolver = RunJSSourceResolverRegistry.getResolver('js-template');
    const secondApp = createLegacyApplication();
    await secondApp.load();
    const secondJsTemplate = new PluginJsTemplateClient({ name: 'js-template', packageName: NAMESPACE }, secondApp);

    await secondJsTemplate.beforeLoad();
    expect(RunJSSourceResolverRegistry.getResolver('js-template')).toBeNull();

    const secondPlugins = await loadLegacyPlugins(secondApp);
    expect(RunJSSourceResolverRegistry.getResolvers()).toHaveLength(1);
    expect(RunJSSourceResolverRegistry.getResolver('js-template')).not.toBe(firstResolver);
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(1);
    expect(
      RunJSEditorRegistry.getProviders().filter((provider) => provider.key === 'js-template-runjs-value'),
    ).toHaveLength(1);
    expect(LegacyRunJSEditorRegistry.getProviders().map((provider) => provider.key)).toEqual([
      '@nocobase/runjs/workspace/legacy-runjs-studio',
    ]);
    secondPlugins.jsTemplate.dispose();
    secondPlugins.flowEngine.dispose();
    firstPlugins.jsTemplate.dispose();
    firstPlugins.flowEngine.dispose();
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
    const { flowEngine, jsTemplate } = await loadLegacyPlugins(app);
    const studioProvider = LegacyRunJSEditorRegistry.getProvider(stepProps);

    expect(studioProvider?.key).toBe('@nocobase/runjs/workspace/legacy-runjs-studio');
    expect(LegacyRunJSEditorRegistry.getProvider(workflowProps)).toBe(inlineProvider);
    const studio = render(
      <ApplicationContext.Provider value={app}>{studioProvider?.renderEditor(stepProps)}</ApplicationContext.Provider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save step source' }));
    expect(stepProps.onChange).toHaveBeenCalledWith({ code: 'return 2;', version: 'v2' });

    jsTemplate.dispose();
    expect(LegacyRunJSEditorRegistry.getProvider(workflowProps)).toBe(inlineProvider);
    expect(LegacyRunJSEditorRegistry.getProvider(stepProps)).toBeNull();
    expect(RunJSEditorRegistry.getProviders()).toHaveLength(0);
    expect(RunJSSourceResolverRegistry.getResolvers()).toHaveLength(0);
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(0);
    expect(app.pluginSettingsManager.get(JS_TEMPLATE_SETTINGS_KEY, false)).toBeNull();
    expect(app.router.has(`admin.settings.${JS_TEMPLATE_SETTINGS_KEY}`)).toBe(false);
    studio.unmount();
    render(<>{LegacyRunJSEditorRegistry.getProvider(workflowProps)?.renderEditor(workflowProps)}</>);
    expect(screen.getByText('Workflow inline editor')).toBeVisible();

    await jsTemplate.load();
    expect(LegacyRunJSEditorRegistry.getProviders().map((provider) => provider.key)).toEqual([
      'workflow-inline',
      '@nocobase/runjs/workspace/legacy-runjs-studio',
    ]);
    expect(
      RunJSEditorRegistry.getProviders().filter(
        (provider) => provider.key === '@nocobase/runjs/workspace/runjs-studio',
      ),
    ).toHaveLength(1);
    expect(RunJSSourceResolverRegistry.getResolvers()).toHaveLength(1);
    expect(LegacyRunJSEditorRegistry.getProvider(workflowProps)).toBe(inlineProvider);
    expect(LegacyRunJSEditorRegistry.getProvider(stepProps)?.key).toBe('@nocobase/runjs/workspace/legacy-runjs-studio');

    jsTemplate.dispose();
    expect(LegacyRunJSEditorRegistry.getProvider(workflowProps)).toBe(inlineProvider);
    expect(LegacyRunJSEditorRegistry.getProvider(stepProps)).toBeNull();
    flowEngine.dispose();
  });
});
