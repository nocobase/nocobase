/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { JS_TEMPLATE_SOURCE_MODE as CORE_JS_TEMPLATE_SOURCE_MODE } from '@nocobase/client-v2';
import { describe, expect, it, vi } from 'vitest';

import { JS_TEMPLATE_SOURCE_BINDING_TYPE, JS_TEMPLATE_SOURCE_MODE, JS_TEMPLATE_SUPPORTED_KINDS } from '../../constants';
import {
  createJsTemplateRuntimeSourceBinding,
  isJsTemplateRuntimeSourceBinding,
  serializeJsTemplateRunJSPersistence,
} from '../../shared/jsTemplateSourceBinding';
import type {
  JsTemplateArtifact,
  JsTemplateRuntimeResolveResult,
  JsTemplateRuntimeSourceBinding,
} from '../../shared/types';
import type { ApiClientLike, ApiRequestOptions } from '../api/jsTemplatesRequests';
import {
  JS_TEMPLATE_EDITOR_PROVIDER_KEY,
  JS_TEMPLATE_KIND_BY_MODEL_USE,
  JS_TEMPLATE_MODEL_MENU_PROVIDER_KEY,
  JS_TEMPLATE_RUNTIME_CONTEXT_KEY,
  JS_TEMPLATE_SOURCE_MENU_GROUP_KEY,
  JS_TEMPLATE_SOURCE_METADATA_KIND_KEY,
  JS_TEMPLATE_TOOLBAR_CONTRIBUTION_KEY,
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
  it('uses unique canonical registry keys and resolves every supported kind from model use', () => {
    expect(CORE_JS_TEMPLATE_SOURCE_MODE).toBe(JS_TEMPLATE_SOURCE_MODE);
    expect(JS_TEMPLATE_SOURCE_METADATA_KIND_KEY).toBe('jsTemplateKind');
    expect(JS_TEMPLATE_RUNTIME_CONTEXT_KEY).toBe('jsTemplate');
    expect(JS_TEMPLATE_SOURCE_MENU_GROUP_KEY).toBe('js-template');

    const registryKeys = [
      JS_TEMPLATE_EDITOR_PROVIDER_KEY,
      JS_TEMPLATE_TOOLBAR_CONTRIBUTION_KEY,
      JS_TEMPLATE_MODEL_MENU_PROVIDER_KEY,
    ];
    expect(registryKeys).toEqual([
      'js-template-runjs-value',
      '@nocobase/plugin-js-template/save-as-js-template',
      '@nocobase/plugin-js-template/model-menus',
    ]);
    expect(new Set(registryKeys).size).toBe(registryKeys.length);
    expect(new Set(Object.values(JS_TEMPLATE_KIND_BY_MODEL_USE))).toEqual(new Set(JS_TEMPLATE_SUPPORTED_KINDS));
  });

  it('strictly round-trips a canonical FlowModel binding without persisting display fields', () => {
    expect(
      createJsTemplateRuntimeSourceBinding({
        projectId: sourceBinding.projectId,
        templateId: sourceBinding.templateId,
        kind: sourceBinding.kind,
      }),
    ).toEqual(sourceBinding);
    expect(isJsTemplateRuntimeSourceBinding(sourceBinding)).toBe(true);
    expect(() =>
      createJsTemplateRuntimeSourceBinding({
        projectId: ' ',
        templateId: sourceBinding.templateId,
        kind: sourceBinding.kind,
      }),
    ).toThrow(TypeError);
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

  it.each([
    {
      type: JS_TEMPLATE_SOURCE_BINDING_TYPE,
      projectId: 'project_1',
      templateId: 'template_1',
    },
    {
      type: JS_TEMPLATE_SOURCE_BINDING_TYPE,
      projectId: 'project_1',
      templateId: 'template_1',
      kind: 'js-block',
      title: 'Display field',
    },
    {
      type: JS_TEMPLATE_SOURCE_BINDING_TYPE,
      projectId: ' ',
      templateId: 'template_1',
      kind: 'js-block',
    },
    {
      type: JS_TEMPLATE_SOURCE_BINDING_TYPE,
      projectId: 'project_1',
      templateId: '\t',
      kind: 'js-block',
    },
    {
      type: JS_TEMPLATE_SOURCE_BINDING_TYPE,
      projectId: 'project_1',
      templateId: 'template_1',
      kind: 'unsupported',
    },
  ])('rejects incomplete or non-canonical bindings: $kind', (binding) => {
    expect(isJsTemplateRuntimeSourceBinding(binding)).toBe(false);
    expect(() => serializeJsTemplateRunJSPersistence(binding)).toThrow(TypeError);
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
