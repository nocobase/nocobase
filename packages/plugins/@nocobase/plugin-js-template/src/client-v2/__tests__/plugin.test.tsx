/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  clearActionGroupMenuItemProviders,
  clearBlockGridSelectSceneAddBlockProviders,
  clearFieldMenuItemProviders,
  createMockClient,
  ActionGroupModel,
  JS_ACTION_JS_TEMPLATE_FULL_SOURCE_FIELD,
  JS_BLOCK_JS_TEMPLATE_FULL_SOURCE_FIELD,
  JS_FIELD_JS_TEMPLATE_FULL_SOURCE_FIELD,
  JS_ITEM_JS_TEMPLATE_FULL_SOURCE_FIELD,
  JS_PAGE_JS_TEMPLATE_FULL_SOURCE_FIELD,
  JS_PAGE_JS_TEMPLATE_SETTINGS_STEP_FIELD,
  JSPageSourceModeField,
  PluginFlowEngine,
  RunJSEditorField,
  RunJSEditorRegistry,
  RunJSSettingsDescriptorProviderRegistry,
  RunJSSourceResolverRegistry,
} from '@nocobase/client-v2';
import { FlowEngineProvider } from '@nocobase/flow-engine';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runJSStudioToolbarRegistry, type RunJSStudioToolbarContext } from '@nocobase/runjs-workspace/client-v2';
import PluginFlowEngineClientV2 from '@nocobase/plugin-flow-engine/client-v2';

import { JS_TEMPLATE_ACL_SNIPPET, JS_TEMPLATE_SETTINGS_KEY, NAMESPACE } from '../../constants';
import enUS from '../../locale/en-US.json';
import zhCN from '../../locale/zh-CN.json';
import {
  JSActionJsTemplateSourceField,
  JSFieldJsTemplateSourceField,
  JSItemJsTemplateSourceField,
  JSPageJsTemplateSourceField,
} from '../components/JSBlockJsTemplateSourceField';
import PluginJsTemplateClientV2, { PluginJsTemplateClientV2 as NamedPluginJsTemplateClientV2 } from '../plugin';

vi.mock('@nocobase/client-v2', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/client-v2')>();
  const ReactModule = await import('react');

  return {
    ...actual,
    CodeEditor: ({
      onChange,
      placeholder,
      readonly,
      runButton,
      toolbarLeftExtra,
      value,
    }: {
      onChange?: (value: string) => void;
      placeholder?: string;
      readonly?: boolean;
      runButton?: React.ReactNode;
      toolbarLeftExtra?: React.ReactNode;
      value?: string;
    }) =>
      ReactModule.createElement(
        'div',
        { 'data-testid': 'studio-code-editor' },
        toolbarLeftExtra,
        runButton,
        ReactModule.createElement('textarea', {
          'aria-label': placeholder,
          onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => onChange?.(event.target.value),
          readOnly: readonly,
          value: value || '',
        }),
      ),
  };
});

describe('plugin-js-template client-v2 locale entries', () => {
  it('keeps English and Chinese keys aligned', () => {
    expect(Object.keys(enUS).sort()).toEqual(Object.keys(zhCN).sort());
  });
});

describe('PluginJsTemplateClientV2', () => {
  afterEach(() => {
    RunJSEditorRegistry.clear();
    RunJSSettingsDescriptorProviderRegistry.clear();
    RunJSSourceResolverRegistry.clear();
    clearBlockGridSelectSceneAddBlockProviders();
    clearActionGroupMenuItemProviders();
    clearFieldMenuItemProviders();
    vi.restoreAllMocks();
  });

  it('registers, disposes, and re-enables without duplicate global contributions', async () => {
    const app = createMockClient({
      plugins: [
        [PluginFlowEngine, { name: 'flow-engine' }],
        [PluginFlowEngineClientV2, { name: 'plugin-flow-engine', packageName: '@nocobase/plugin-flow-engine' }],
        [PluginJsTemplateClientV2, { name: 'js-template', packageName: NAMESPACE }],
      ],
    });

    await app.load();
    const plugin = app.pm.get(PluginJsTemplateClientV2) as PluginJsTemplateClientV2;

    expect(PluginJsTemplateClientV2).toBe(NamedPluginJsTemplateClientV2);
    const canonicalMenu = app.pluginSettingsManager.get(JS_TEMPLATE_SETTINGS_KEY, false);
    const canonicalPage = app.pluginSettingsManager.get(`${JS_TEMPLATE_SETTINGS_KEY}.index`, false);
    expect(canonicalMenu).toMatchObject({
      key: JS_TEMPLATE_SETTINGS_KEY,
      title: 'JS Templates',
      aclSnippet: JS_TEMPLATE_ACL_SNIPPET,
      path: '/admin/settings/js-templates',
    });
    expect(canonicalPage).toMatchObject({
      menuKey: JS_TEMPLATE_SETTINGS_KEY,
      pageKey: 'index',
      componentLoader: expect.any(Function),
      aclSnippet: JS_TEMPLATE_ACL_SNIPPET,
      path: '/admin/settings/js-templates',
    });
    expect(canonicalMenu?.hidden).toBeUndefined();
    expect(canonicalPage?.hidden).toBeUndefined();
    expect(app.flowEngine.flowSettings.components).toMatchObject({
      [JS_ACTION_JS_TEMPLATE_FULL_SOURCE_FIELD]: JSActionJsTemplateSourceField,
      [JS_BLOCK_JS_TEMPLATE_FULL_SOURCE_FIELD]: expect.any(Function),
      [JS_FIELD_JS_TEMPLATE_FULL_SOURCE_FIELD]: JSFieldJsTemplateSourceField,
      [JS_ITEM_JS_TEMPLATE_FULL_SOURCE_FIELD]: JSItemJsTemplateSourceField,
      [JS_PAGE_JS_TEMPLATE_FULL_SOURCE_FIELD]: JSPageJsTemplateSourceField,
    });
    expectJsTemplateRegistrations(1);

    plugin.dispose();

    expect(app.flowEngine.flowSettings.components[JS_PAGE_JS_TEMPLATE_FULL_SOURCE_FIELD]).toBe(JSPageSourceModeField);
    expect(app.flowEngine.flowSettings.components[JS_PAGE_JS_TEMPLATE_SETTINGS_STEP_FIELD]).toBeUndefined();
    expect(RunJSSourceResolverRegistry.getResolver('js-template')).toBeNull();
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders().map((provider) => provider.key)).toEqual([
      '@nocobase/runjs-workspace/inline-settings-descriptor',
    ]);
    expect(RunJSEditorRegistry.getProviders().map((provider) => provider.key)).toEqual([
      '@nocobase/runjs-workspace/runjs-studio',
    ]);
    expect(getToolbarContributionKeys()).not.toContain('@nocobase/plugin-js-template/save-as-js-template');
    expectJsTemplateRegistrations(0);

    await plugin.load();
    expectJsTemplateRegistrations(1);
    expect(app.flowEngine.flowSettings.components[JS_PAGE_JS_TEMPLATE_FULL_SOURCE_FIELD]).toBe(
      JSPageJsTemplateSourceField,
    );

    await plugin.load();
    expectJsTemplateRegistrations(1);

    plugin.dispose();
    expectJsTemplateRegistrations(0);
  });

  it('hands active contributions from one client instance to the next', async () => {
    const appA = createMockClient({
      plugins: [
        [PluginFlowEngine, { name: 'flow-engine-a' }],
        [PluginFlowEngineClientV2, { name: 'plugin-flow-engine-a', packageName: '@nocobase/plugin-flow-engine' }],
        [PluginJsTemplateClientV2, { name: 'js-template-a', packageName: NAMESPACE }],
      ],
    });
    const appB = createMockClient({
      plugins: [
        [PluginFlowEngine, { name: 'flow-engine-b' }],
        [PluginFlowEngineClientV2, { name: 'plugin-flow-engine-b', packageName: '@nocobase/plugin-flow-engine' }],
        [PluginJsTemplateClientV2, { name: 'js-template-b', packageName: NAMESPACE }],
      ],
    });
    let pluginA: PluginJsTemplateClientV2 | undefined;
    let pluginB: PluginJsTemplateClientV2 | undefined;

    expectJsTemplateRegistrations(0);
    expect(ActionGroupModel.menuItemProviders.has(`${NAMESPACE}/model-menus`)).toBe(false);

    try {
      await appA.load();
      pluginA = appA.pm.get(PluginJsTemplateClientV2) as PluginJsTemplateClientV2;
      const resolverA = RunJSSourceResolverRegistry.getResolver('js-template');
      const editorProviderA = getJsTemplateEditorProvider();
      const toolbarContributionA = getJsTemplateToolbarContribution();

      expect(resolverA).not.toBeNull();
      expect(editorProviderA).toBeDefined();
      expect(toolbarContributionA).toBeDefined();
      expect(ActionGroupModel.menuItemProviders.has(`${NAMESPACE}/model-menus`)).toBe(true);

      await appB.load();
      pluginB = appB.pm.get(PluginJsTemplateClientV2) as PluginJsTemplateClientV2;
      const resolverB = RunJSSourceResolverRegistry.getResolver('js-template');
      const editorProviderB = getJsTemplateEditorProvider();
      const toolbarContributionB = getJsTemplateToolbarContribution();

      expect(resolverB).not.toBe(resolverA);
      expect(editorProviderB).not.toBe(editorProviderA);
      expect(toolbarContributionB).not.toBe(toolbarContributionA);
      expect(appA.flowEngine.flowSettings.components[JS_PAGE_JS_TEMPLATE_FULL_SOURCE_FIELD]).toBe(
        JSPageSourceModeField,
      );
      expect(appB.flowEngine.flowSettings.components[JS_PAGE_JS_TEMPLATE_FULL_SOURCE_FIELD]).toBe(
        JSPageJsTemplateSourceField,
      );

      pluginA.dispose();

      expect(RunJSSourceResolverRegistry.getResolver('js-template')).toBe(resolverB);
      expect(getJsTemplateEditorProvider()).toBe(editorProviderB);
      expect(getJsTemplateToolbarContribution()).toBe(toolbarContributionB);
      expect(ActionGroupModel.menuItemProviders.has(`${NAMESPACE}/model-menus`)).toBe(true);
      expect(appB.flowEngine.flowSettings.components[JS_PAGE_JS_TEMPLATE_FULL_SOURCE_FIELD]).toBe(
        JSPageJsTemplateSourceField,
      );

      pluginB.dispose();

      expectJsTemplateRegistrations(0);
      expect(ActionGroupModel.menuItemProviders.has(`${NAMESPACE}/model-menus`)).toBe(false);
      expect(appB.flowEngine.flowSettings.components[JS_PAGE_JS_TEMPLATE_FULL_SOURCE_FIELD]).toBe(
        JSPageSourceModeField,
      );
    } finally {
      pluginA?.dispose();
      pluginB?.dispose();
      (appA.pm.get(PluginFlowEngineClientV2) as PluginFlowEngineClientV2).dispose();
      (appB.pm.get(PluginFlowEngineClientV2) as PluginFlowEngineClientV2).dispose();
    }
  });

  it('renders a moved inline JS block through the modern multi-file Studio with its move-back action', async () => {
    const app = createMockClient({
      plugins: [
        [PluginFlowEngine, { name: 'flow-engine' }],
        [PluginFlowEngineClientV2, { name: 'plugin-flow-engine', packageName: '@nocobase/plugin-flow-engine' }],
        [PluginJsTemplateClientV2, { name: 'js-template', packageName: NAMESPACE }],
      ],
    });
    const locator = {
      kind: 'flowModel.step' as const,
      modelUid: 'fm_moved_inline',
      flowKey: 'jsSettings',
      stepKey: 'runJs',
      paramPath: ['code'],
    };
    const request = vi.spyOn(app.apiClient, 'request').mockResolvedValue({
      data: {
        data: {
          locator,
          locatorKind: 'flowModel.step',
          repositoryIdentity: {
            ownerType: 'runjs-source',
            ownerId: 'fm_moved_inline:jsSettings:runJs:code',
            name: 'source',
          },
          legacy: {
            code: 'ctx.render(<div>Moved inline</div>);',
            version: 'v2',
            label: 'Moved inline block / Write JavaScript',
            surfaceStyle: 'render',
            language: 'typescript',
            entryPath: 'src/client/index.tsx',
            ownerFingerprint: 'owner-fingerprint-1',
          },
          ownerFingerprint: 'owner-fingerprint-1',
          source: {
            label: 'Moved inline block / Write JavaScript',
            kind: 'flowModel.step',
            surfaceStyle: 'render',
            runtimeVersion: 'v2',
            language: 'typescript',
            ownerFingerprint: 'owner-fingerprint-1',
            metadata: { modelUse: 'JSBlockModel' },
          },
          repository: {
            id: 'repo-inline-1',
            repoId: 'repo-inline-1',
            ownerType: 'runjs-source',
            ownerId: 'fm_moved_inline:jsSettings:runJs:code',
            name: 'source',
            status: 'active',
            defaultRef: 'head',
            headCommitId: 'commit-inline-1',
            headSeq: 1,
          },
          files: [
            {
              path: 'src/client/index.tsx',
              content: 'ctx.render(<div>Moved inline</div>);',
              blobHash: 'a'.repeat(64),
              size: 43,
              managed: false,
              language: 'typescript',
              mode: '100644',
            },
            {
              path: 'src/shared/format.ts',
              content: 'export const format = (value: string) => value;',
              blobHash: 'b'.repeat(64),
              size: 48,
              managed: false,
              language: 'typescript',
              mode: '100644',
            },
          ],
          permissions: { canRead: true, canWrite: true, canSave: true },
          history: { items: [] },
          settingsDescriptor: {
            descriptorPath: 'src/client/settings.ts',
            entryId: null,
            key: null,
            schema: null,
            defaults: {},
            settingsSchemaHash: null,
            settingsDefaultsHash: null,
            diagnostics: [],
          },
        },
      },
    } as never);

    await app.load();
    const editor = render(
      <FlowEngineProvider engine={app.flowEngine}>
        <RunJSEditorField
          locator={locator}
          scene="block"
          sourceMetadata={{ jsTemplateKind: 'js-block' }}
          surfaceStyle="render"
          value={{
            code: 'ctx.render(<div>Moved inline</div>);',
            version: 'v2',
            sourceMode: 'inline',
            sourceRef: {
              type: 'vsc-file',
              repoId: 'repo-inline-1',
              commitId: 'commit-inline-1',
              entry: 'src/client/index.tsx',
            },
          }}
        />
      </FlowEngineProvider>,
    );

    expect(await screen.findByTestId('runjs-studio-workspace')).toBeInTheDocument();
    expect(screen.getByTestId('studio-code-editor')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expand files' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'src/client/index.tsx' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move to JS Template' })).toBeInTheDocument();
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'runJSSources:open',
        data: expect.objectContaining({ locator }),
      }),
    );

    editor.unmount();
    (app.pm.get(PluginJsTemplateClientV2) as PluginJsTemplateClientV2).dispose();
    (app.pm.get(PluginFlowEngineClientV2) as PluginFlowEngineClientV2).dispose();
  });
});

function expectJsTemplateRegistrations(count: number) {
  expect(RunJSSourceResolverRegistry.getResolvers()).toHaveLength(count);
  expect(
    RunJSEditorRegistry.getProviders().filter((provider) => provider.key === 'js-template-runjs-value'),
  ).toHaveLength(count);
  expect(
    getToolbarContributionKeys().filter((key) => key === '@nocobase/plugin-js-template/save-as-js-template'),
  ).toHaveLength(count);
}

function getToolbarContributionKeys(): string[] {
  return runJSStudioToolbarRegistry
    .list({
      locator: { kind: 'flowModel.step' },
      workspace: {
        permissions: { canWrite: true },
        source: { metadata: { modelUse: 'JSBlockModel' } },
      },
      readOnly: false,
    } as unknown as RunJSStudioToolbarContext)
    .map((contribution) => contribution.key);
}

function getJsTemplateEditorProvider() {
  return RunJSEditorRegistry.getProviders().find((provider) => provider.key === 'js-template-runjs-value');
}

function getJsTemplateToolbarContribution() {
  return runJSStudioToolbarRegistry
    .list({
      locator: { kind: 'flowModel.step' },
      workspace: {
        permissions: { canWrite: true },
        source: { metadata: { modelUse: 'JSBlockModel' } },
      },
      readOnly: false,
    } as unknown as RunJSStudioToolbarContext)
    .find((contribution) => contribution.key === '@nocobase/plugin-js-template/save-as-js-template');
}
