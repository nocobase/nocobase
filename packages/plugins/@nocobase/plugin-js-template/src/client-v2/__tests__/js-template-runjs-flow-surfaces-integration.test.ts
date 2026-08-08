/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  JS_ACTION_JS_TEMPLATE_FULL_SOURCE_FIELD,
  JS_TEMPLATE_ACTION_FULL_SOURCE_FIELD,
  JS_TEMPLATE_SOURCE_MODE as CORE_JS_TEMPLATE_SOURCE_MODE,
} from '@nocobase/client-v2';
import { describe, expect, it, vi } from 'vitest';

import {
  JS_TEMPLATE_RUNJS_PERSISTENCE_RUNTIME_CONTRACT,
  serializeJsTemplateRunJSPersistence,
} from '../../shared/jsTemplateRunJSPersistence';
import type {
  JsTemplateArtifact,
  JsTemplateRuntimeResolveResult,
  JsTemplateRuntimeSourceBinding,
} from '../../shared/types';
import type { ApiClientLike, ApiRequestOptions } from '../api/jsTemplatesRequests';
import {
  JS_TEMPLATE_RUNJS_FLOW_SURFACES,
  JS_TEMPLATE_RUNJS_FLOW_SURFACES_INTEGRATION_CONTRACT,
} from '../jsTemplateRunJSIntegrationContract';
import { createJsTemplateRunJSResolver } from '../resolvers/JsTemplateRunJSResolver';

const entryPath = 'src/client/js-actions/example/index.ts';

const sourceBinding: JsTemplateRuntimeSourceBinding = {
  type: 'js-template-entry',
  projectId: 'project_1',
  templateId: 'template_1',
  kind: 'js-action',
};

describe('JS Template RunJS and Flow Surfaces integration contract', () => {
  it('uses the canonical source mode on the established registry and FlowModel keys', () => {
    expect(CORE_JS_TEMPLATE_SOURCE_MODE).toBe('js-template');
    expect(JS_TEMPLATE_ACTION_FULL_SOURCE_FIELD).toBe(JS_ACTION_JS_TEMPLATE_FULL_SOURCE_FIELD);
    expect(JS_TEMPLATE_RUNJS_FLOW_SURFACES_INTEGRATION_CONTRACT).toMatchObject({
      persistence: JS_TEMPLATE_RUNJS_PERSISTENCE_RUNTIME_CONTRACT,
      locatorKind: 'flowModel.step',
      stepKey: 'runJs',
      paramPath: ['code'],
      versionPath: ['version'],
      sourceMetadataKindKey: 'jsTemplateKind',
      runtimeContextKey: 'jsTemplate',
      sourceMenuGroupKey: 'js-template',
      editorProviderKey: 'js-template-runjs-value',
      toolbarContributionKey: '@nocobase/plugin-js-template/save-as-js-template',
      modelMenuProviderKey: '@nocobase/plugin-js-template/model-menus',
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
  });

  it('round-trips a canonical FlowModel binding without persisting display fields', () => {
    const flowModel = {
      uid: 'js_template_action',
      use: 'JSActionModel',
      stepParams: {
        clickSettings: {
          runJs: {
            version: 'v2',
            sourceMode: 'js-template',
            sourceBinding,
            settings: { message: 'kept' },
          },
        },
      },
    };
    const saved = JSON.parse(JSON.stringify(flowModel)) as typeof flowModel;
    const persisted = serializeJsTemplateRunJSPersistence(saved.stepParams.clickSettings.runJs.sourceBinding);
    Object.assign(saved.stepParams.clickSettings.runJs, persisted);

    expect(saved).toEqual(flowModel);
    expect(saved.stepParams.clickSettings.runJs.sourceMode).toBe('js-template');
    expect(saved.stepParams.clickSettings.runJs.sourceBinding).toEqual(sourceBinding);
    expect(Object.keys(saved.stepParams.clickSettings.runJs)).toEqual([
      'version',
      'sourceMode',
      'sourceBinding',
      'settings',
    ]);
  });

  it('resolves runtime code through canonical resource actions', async () => {
    const canonical = createRuntimeApi();
    const input = {
      sourceMode: 'js-template' as const,
      sourceBinding,
      settings: { message: 'hello' },
      context: { surfaceStyle: 'action' },
    };

    const canonicalResult = await createJsTemplateRunJSResolver(canonical.api).resolve(input);

    expect(canonicalResult).toMatchObject({
      code: 'ctx.message.success(settings.message);',
      version: 'v2',
      settings: { message: 'hello' },
      context: {
        surfaceStyle: 'action',
        jsTemplate: {
          templateId: 'template_1',
          artifactHash: 'artifact_hash',
          runtimeCodeHash: 'runtime_hash',
        },
      },
    });
    expect(canonical.request.mock.calls.map(([options]) => options.url)).toEqual([
      'jsTemplateRuntime:resolve',
      'jsTemplateRuntime:getArtifact/artifact_hash',
    ]);
    expect(canonical.request.mock.calls[0][0].data).toMatchObject({
      sourceMode: 'js-template',
      sourceBinding: { type: 'js-template-entry' },
      settings: { message: 'hello' },
    });
  });

  it('loads settings schema defaults from the canonical Template catalog', async () => {
    const canonical = createCatalogApi('jsTemplates:listSelectable');
    const input = { sourceMode: 'js-template' as const, sourceBinding, settings: { message: 'saved' } };

    const canonicalDescriptor = await createJsTemplateRunJSResolver(canonical.api).getSettingsDescriptor?.(input);

    expect(canonicalDescriptor).toEqual({
      entryId: 'template_1',
      settingsSchemaHash: 'schema_hash',
      schema: {
        type: 'object',
        properties: { message: { type: 'string', default: 'Hello' } },
      },
      defaults: { message: 'Hello' },
    });
    expect(canonical.request).toHaveBeenCalledWith({ url: 'jsTemplates:listSelectable', method: 'post' });
  });

  it('preserves disabled-plugin failures through the canonical resolver', async () => {
    const error = Object.assign(new Error('plugin disabled'), {
      code: 'JS_TEMPLATE_DOMAIN_UNAVAILABLE',
      status: 503,
    });
    const api: ApiClientLike = {
      request: vi.fn(async () => {
        throw error;
      }),
    };

    await expect(
      createJsTemplateRunJSResolver(api).resolve({ sourceMode: 'js-template', sourceBinding, settings: {} }),
    ).rejects.toMatchObject({ code: 'JS_TEMPLATE_DOMAIN_UNAVAILABLE', status: 503 });
  });
});

function createRuntimeApi() {
  const request = vi.fn(async (options: ApiRequestOptions) => {
    if (options.url === 'jsTemplateRuntime:resolve') {
      const settings = (options.data as { settings?: Record<string, unknown> }).settings || {};
      const resolveResult = {
        templateId: 'template_1',
        entryPath,
        artifactHash: 'artifact_hash',
        artifactUrl: '/api/jsTemplateRuntime:getArtifact/artifact_hash',
        runtimeCodeHash: 'runtime_hash',
        runtimeVersion: 'v2',
        settings,
        settingsHash: 'settings_hash',
      } satisfies JsTemplateRuntimeResolveResult;
      return {
        data: {
          data: resolveResult,
        },
      };
    }
    const artifact = {
      artifactHash: 'artifact_hash',
      runtimeCodeHash: 'runtime_hash',
      code: 'ctx.message.success(settings.message);',
      sourceMap: '{"version":3}',
      runtimeVersion: 'v2',
      entryPath,
      runtimeContract: 'js-template.runtime-artifact.v1',
      byteSize: 42,
    } satisfies JsTemplateArtifact;
    return {
      data: {
        data: artifact,
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
            id: 'template_1',
            projectId: 'project_1',
            kind: 'js-action',
            templateName: 'example-action',
            entryPath,
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
