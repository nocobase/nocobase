/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  JS_ACTION_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_TEMPLATE_ACTION_FULL_SOURCE_FIELD,
  JS_TEMPLATE_SOURCE_MODE as CORE_JS_TEMPLATE_SOURCE_MODE,
} from '@nocobase/client-v2';
import { describe, expect, it, vi } from 'vitest';

import {
  JS_TEMPLATE_RUNJS_PERSISTENCE_RUNTIME_CONTRACT,
  serializeJsTemplateRunJSPersistence,
} from '../../shared/jsTemplateRunJSPersistence';
import type { LightExtensionRuntimeSourceBinding } from '../../shared/types';
import type { ApiClientLike, ApiRequestOptions } from '../api/lightExtensionEntriesRequests';
import {
  createMoveSourceToJsTemplateContribution,
  createMoveSourceToLightExtensionContribution,
} from '../components/MoveSourceToLightExtension';
import {
  createJsTemplateRunJSEditorProvider,
  createRunJSLightExtensionEditorProvider,
} from '../components/RunJSLightExtensionEditorProvider';
import {
  installJsTemplateRunJSIntegrations,
  installLightExtensionRunJSIntegrations,
} from '../jsTemplateRunJSIntegration';
import {
  JS_TEMPLATE_RUNJS_FLOW_SURFACES,
  JS_TEMPLATE_RUNJS_FLOW_SURFACES_INTEGRATION_CONTRACT,
} from '../jsTemplateRunJSIntegrationContract';
import {
  createJsTemplateModelMenuProvider,
  createLightExtensionModelMenuProvider,
} from '../modelMenu/createLightExtensionModelMenuProvider';
import {
  createJsTemplateRunJSResolver,
  createLightExtensionRunJSResolver,
} from '../resolvers/LightExtensionRunJSResolver';

const sourceBinding: LightExtensionRuntimeSourceBinding = {
  type: 'light-extension-entry',
  repoId: 'repo_1',
  entryId: 'entry_1',
  entryPath: 'src/client/js-actions/example/index.ts',
  kind: 'js-action',
};

describe('JS Template RunJS and Flow Surfaces integration contract', () => {
  it('keeps canonical TypeScript aliases on the historical registry and FlowModel keys', () => {
    expect(CORE_JS_TEMPLATE_SOURCE_MODE).toBe('light-extension');
    expect(JS_TEMPLATE_ACTION_FULL_SOURCE_FIELD).toBe(JS_ACTION_LIGHT_EXTENSION_FULL_SOURCE_FIELD);
    expect(JS_TEMPLATE_RUNJS_FLOW_SURFACES_INTEGRATION_CONTRACT).toMatchObject({
      persistence: JS_TEMPLATE_RUNJS_PERSISTENCE_RUNTIME_CONTRACT,
      locatorKind: 'flowModel.step',
      stepKey: 'runJs',
      paramPath: ['code'],
      versionPath: ['version'],
      sourceMetadataKindKey: 'lightExtensionKind',
      runtimeContextKey: 'lightExtension',
      sourceMenuGroupKey: 'light-extension',
      editorProviderKey: 'light-extension-runjs-value',
      toolbarContributionKey: '@nocobase/plugin-light-extension/move-source',
      modelMenuProviderKey: '@nocobase/plugin-light-extension/model-menus',
      supportedSurfaceStyles: ['render', 'value', 'action'],
      automaticPreviewSurfaceStyles: ['render'],
    });
    expect(JS_TEMPLATE_RUNJS_FLOW_SURFACES).toEqual([
      { modelUse: 'JSBlockModel', flowKey: 'jsSettings', kind: 'js-block', surfaceStyle: 'render' },
      { modelUse: 'JSPageModel', flowKey: 'jsSettings', kind: 'js-page', surfaceStyle: 'render' },
      { modelUse: 'JSFieldModel', flowKey: 'jsSettings', kind: 'js-field', surfaceStyle: 'render' },
      { modelUse: 'JSEditableFieldModel', flowKey: 'jsSettings', kind: 'js-field', surfaceStyle: 'render' },
      { modelUse: 'JSColumnModel', flowKey: 'jsSettings', kind: 'js-field', surfaceStyle: 'render' },
      { modelUse: 'JSItemModel', flowKey: 'jsSettings', kind: 'js-item', surfaceStyle: 'render' },
      { modelUse: 'JSItemActionModel', flowKey: 'jsSettings', kind: 'js-item', surfaceStyle: 'render' },
      { modelUse: 'JSActionModel', flowKey: 'clickSettings', kind: 'js-action', surfaceStyle: 'action' },
      { modelUse: 'JSRecordActionModel', flowKey: 'clickSettings', kind: 'js-action', surfaceStyle: 'action' },
      { modelUse: 'JSCollectionActionModel', flowKey: 'clickSettings', kind: 'js-action', surfaceStyle: 'action' },
      { modelUse: 'JSFormActionModel', flowKey: 'clickSettings', kind: 'js-action', surfaceStyle: 'action' },
      { modelUse: 'FilterFormJSActionModel', flowKey: 'clickSettings', kind: 'js-action', surfaceStyle: 'action' },
    ]);
    expect(createRunJSLightExtensionEditorProvider).toBe(createJsTemplateRunJSEditorProvider);
    expect(createMoveSourceToLightExtensionContribution).toBe(createMoveSourceToJsTemplateContribution);
    expect(createLightExtensionModelMenuProvider).toBe(createJsTemplateModelMenuProvider);
    expect(installLightExtensionRunJSIntegrations).toBe(installJsTemplateRunJSIntegrations);
  });

  it('round-trips a historical FlowModel binding without rewriting any wire key', () => {
    const historicalFlowModel = {
      uid: 'legacy_js_action',
      use: 'JSActionModel',
      stepParams: {
        clickSettings: {
          runJs: {
            version: 'v2',
            sourceMode: 'light-extension',
            sourceBinding: {
              ...sourceBinding,
              entryName: 'example-action',
            },
            settings: { message: 'kept' },
          },
        },
      },
    };
    const saved = JSON.parse(JSON.stringify(historicalFlowModel)) as typeof historicalFlowModel;
    const persisted = serializeJsTemplateRunJSPersistence(saved.stepParams.clickSettings.runJs.sourceBinding);
    Object.assign(saved.stepParams.clickSettings.runJs, persisted);

    expect(saved).toEqual(historicalFlowModel);
    expect(saved.stepParams.clickSettings.runJs.sourceMode).toBe('light-extension');
    expect(saved.stepParams.clickSettings.runJs.sourceBinding.type).toBe('light-extension-entry');
    expect(Object.keys(saved.stepParams.clickSettings.runJs)).toEqual([
      'version',
      'sourceMode',
      'sourceBinding',
      'settings',
    ]);
  });

  it('keeps canonical and legacy runtime results equal while using their respective HTTP aliases', async () => {
    const canonical = createRuntimeApi('canonical');
    const legacy = createRuntimeApi('legacy');
    const input = {
      sourceMode: 'light-extension' as const,
      sourceBinding,
      settings: { message: 'hello' },
      context: { surfaceStyle: 'action' },
    };

    const canonicalResult = await createJsTemplateRunJSResolver(canonical.api).resolve(input);
    const legacyResult = await createLightExtensionRunJSResolver(legacy.api).resolve(input);

    expect(canonicalResult).toEqual(legacyResult);
    expect(canonicalResult).toMatchObject({
      code: 'ctx.message.success(settings.message);',
      version: 'v2',
      settings: { message: 'hello' },
      context: {
        surfaceStyle: 'action',
        lightExtension: {
          entryId: 'entry_1',
          artifactHash: 'artifact_hash',
          runtimeCodeHash: 'runtime_hash',
        },
      },
    });
    expect(canonical.request.mock.calls.map(([options]) => options.url)).toEqual([
      'jsTemplateRuntime:resolve',
      'jsTemplateRuntime:getArtifact',
    ]);
    expect(canonical.request.mock.calls[0][0].data).toMatchObject({
      sourceMode: 'light-extension',
      sourceBinding: { type: 'light-extension-entry' },
      settings: { message: 'hello' },
    });
    expect(legacy.request.mock.calls.map(([options]) => options.url)).toEqual([
      '/light-extension-runtime/resolve',
      '/light-extension-runtime/artifacts/artifact_hash',
    ]);
  });

  it('keeps settings schema defaults equal across canonical and legacy catalogs', async () => {
    const canonical = createCatalogApi('jsTemplateEntries:listSelectable');
    const legacy = createCatalogApi('lightExtensionEntries:listSelectable');
    const input = { sourceMode: 'light-extension' as const, sourceBinding, settings: { message: 'saved' } };

    const canonicalDescriptor = await createJsTemplateRunJSResolver(canonical.api).getSettingsDescriptor?.(input);
    const legacyDescriptor = await createLightExtensionRunJSResolver(legacy.api).getSettingsDescriptor?.(input);

    expect(canonicalDescriptor).toEqual(legacyDescriptor);
    expect(canonicalDescriptor).toEqual({
      entryId: 'entry_1',
      settingsSchemaHash: 'schema_hash',
      schema: {
        type: 'object',
        properties: { message: { type: 'string', default: 'Hello' } },
      },
      defaults: { message: 'Hello' },
    });
    expect(canonical.request).toHaveBeenCalledWith({ url: 'jsTemplateEntries:listSelectable', method: 'post' });
    expect(legacy.request).toHaveBeenCalledWith({ url: 'lightExtensionEntries:listSelectable', method: 'post' });
  });

  it('preserves legacy error codes and disabled-plugin failures through both resolver facades', async () => {
    for (const createResolver of [createJsTemplateRunJSResolver, createLightExtensionRunJSResolver]) {
      const error = Object.assign(new Error('plugin disabled'), {
        code: 'LIGHT_EXTENSION_DOMAIN_UNAVAILABLE',
        status: 503,
      });
      const api: ApiClientLike = {
        request: vi.fn(async () => {
          throw error;
        }),
      };

      await expect(
        createResolver(api).resolve({ sourceMode: 'light-extension', sourceBinding, settings: {} }),
      ).rejects.toMatchObject({ code: 'LIGHT_EXTENSION_DOMAIN_UNAVAILABLE', status: 503 });
    }
  });
});

function createRuntimeApi(mode: 'canonical' | 'legacy') {
  const request = vi.fn(async (options: ApiRequestOptions) => {
    const resolveUrl = mode === 'canonical' ? 'jsTemplateRuntime:resolve' : '/light-extension-runtime/resolve';
    if (options.url === resolveUrl) {
      const settings = (options.data as { settings?: Record<string, unknown> }).settings || {};
      return {
        data: {
          data: {
            entryId: 'entry_1',
            entryPath: sourceBinding.entryPath,
            artifactHash: 'artifact_hash',
            artifactUrl: '/api/light-extension-runtime/artifacts/artifact_hash',
            runtimeCodeHash: 'runtime_hash',
            version: 'v2',
            settings,
            settingsHash: 'settings_hash',
          },
        },
      };
    }
    return {
      data: {
        data: {
          artifactHash: 'artifact_hash',
          runtimeCodeHash: 'runtime_hash',
          code: 'ctx.message.success(settings.message);',
          sourceMap: '{"version":3}',
          version: 'v2',
          entryPath: sourceBinding.entryPath,
          runtimeContract: 'light-extension.runtime-artifact.v1',
          byteSize: 42,
        },
      },
    };
  });
  const api: ApiClientLike = {
    request: async <TResponse>(options: ApiRequestOptions) => (await request(options)) as TResponse,
  };
  return { api, request };
}

function createCatalogApi(url: string) {
  const request = vi.fn(async (options: ApiRequestOptions) => {
    if (options.url !== url) {
      throw new Error(`Unexpected request: ${options.url}`);
    }
    return {
      data: {
        data: [
          {
            id: 'entry_1',
            repoId: 'repo_1',
            kind: 'js-action',
            entryName: 'example-action',
            entryPath: sourceBinding.entryPath,
            title: 'Example action',
            category: null,
            settingsSchema: {
              type: 'object',
              properties: { message: { type: 'string', default: 'Hello' } },
            },
            settingsSchemaHash: 'schema_hash',
            settingsDefaultsHash: 'defaults_hash',
            runtimeCodeHash: 'runtime_hash',
            runtimeAvailable: true,
          },
        ],
      },
    };
  });
  const api: ApiClientLike = {
    request: async <TResponse>(options: ApiRequestOptions) => (await request(options)) as TResponse,
  };
  return { api, request };
}
