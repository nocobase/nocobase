/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { JsTemplateArtifact, JsTemplateRuntimeResolveResult } from '../../shared/types';
import { type ApiClientLike, type ApiRequestOptions } from '../api/jsTemplatesRequests';
import { JSBlockJsTemplateSourceField } from '../components/JSBlockJsTemplateSourceField';
import { createJsTemplateRunJSResolver } from '../resolvers/JsTemplateRunJSResolver';
import { invalidateJsTemplateRuntimeCache } from '../resolvers/JsTemplateRuntimeCacheRegistry';
import { createForm } from '@formily/core';
import { createSchemaField, FormProvider } from '@formily/react';
import { JSBlockModel } from '@nocobase/client-v2';
import { RunJSSourceResolverRegistry } from '@nocobase/runjs/workspace/client-v2';
import { FlowEngine, FlowEngineProvider, FlowModelRenderer } from '@nocobase/flow-engine';
import { render as nbRender, screen as nbScreen, waitFor as nbWaitFor } from '@nocobase/test/client';
import { setupRunJSTestHosts } from '@nocobase/test/client-v2';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App, ConfigProvider } from 'antd';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  t: vi.fn((key: string) => key),
}));

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next');
  return {
    ...actual,
    useTranslation: () => ({
      t: mocks.t,
    }),
  };
});

setupRunJSTestHosts();

// Consolidated from runjs-source-resolver-immutable-cache.cases.ts.
function registerImmutableCacheTests() {
  const artifactHash = 'a'.repeat(64);
  const sourceBinding = {
    type: 'js-template-entry',
    projectId: 'project_1',
    templateId: 'template_1',
    kind: 'js-action',
  } as const;

  describe('JS Template immutable artifact cache', () => {
    it('accepts a proxied source binding from flow model state', async () => {
      const request = vi.fn(async (options: ApiRequestOptions) => {
        return options.method === 'get' ? artifactResponse() : resolveResponse(options.data);
      });
      const { resolver } = createResolver(request);
      const proxiedSourceBinding = new Proxy(sourceBinding, {});

      await expect(
        resolver.resolve({ sourceMode: 'js-template', sourceBinding: proxiedSourceBinding, settings: {} }),
      ).resolves.toMatchObject({ code: expect.stringContaining('ACTION_V1') });
      expect(request.mock.calls.find(([options]) => options.method === 'post')?.[0].data).toMatchObject({
        sourceBinding,
      });
    });

    it('fetches artifacts through the canonical resource action regardless of the response URL', async () => {
      const request = vi.fn(async (options: ApiRequestOptions) => {
        return options.method === 'get'
          ? artifactResponse()
          : resolveResponse(options.data, `/foo/api/jsTemplateRuntime:getArtifact/${artifactHash}`);
      });
      const { resolver } = createResolver(request);

      await expect(resolver.resolve({ sourceMode: 'js-template', sourceBinding, settings: {} })).resolves.toMatchObject(
        {
          code: expect.stringContaining('ACTION_V1'),
        },
      );

      expect(request.mock.calls.find(([options]) => options.method === 'get')?.[0].url).toBe(
        `jsTemplateRuntime:getArtifact/${artifactHash}`,
      );
    });

    it('does not execute cached code after the repository cache is invalidated', async () => {
      let resolveCount = 0;
      const request = vi.fn(async (options: ApiRequestOptions) => {
        if (options.method === 'get') {
          return artifactResponse();
        }
        resolveCount += 1;
        if (resolveCount === 2) {
          throw new Error('repo disabled');
        }
        return resolveResponse(options.data);
      });
      const { api, resolver } = createResolver(request);

      await resolver.resolve({ sourceMode: 'js-template', sourceBinding, settings: {} });
      invalidateJsTemplateRuntimeCache(api, sourceBinding.projectId);
      await expect(resolver.resolve({ sourceMode: 'js-template', sourceBinding, settings: {} })).rejects.toThrow(
        'repo disabled',
      );
    });

    it('does not retain domain errors after the in-flight request settles', async () => {
      const request = vi.fn(async () => {
        throw Object.assign(new Error('permission denied'), { code: 'JS_TEMPLATE_PERMISSION_DENIED' });
      });
      const { resolver } = createResolver(request);

      await expect(resolver.resolve({ sourceMode: 'js-template', sourceBinding, settings: {} })).rejects.toMatchObject({
        code: 'JS_TEMPLATE_PERMISSION_DENIED',
      });
      await expect(resolver.resolve({ sourceMode: 'js-template', sourceBinding, settings: {} })).rejects.toMatchObject({
        code: 'JS_TEMPLATE_PERMISSION_DENIED',
      });
      expect(request).toHaveBeenCalledTimes(2);
    });

    it('re-resolves at most once after an Artifact 404', async () => {
      let artifactRequests = 0;
      const request = vi.fn(async (options: ApiRequestOptions) => {
        if (options.method !== 'get') {
          return resolveResponse(options.data);
        }
        artifactRequests += 1;
        if (artifactRequests === 1) {
          throw Object.assign(new Error('missing'), { response: { status: 404 } });
        }
        return artifactResponse();
      });
      const { resolver } = createResolver(request);

      await expect(resolver.resolve({ sourceMode: 'js-template', sourceBinding, settings: {} })).resolves.toMatchObject(
        {
          code: expect.stringContaining('ACTION_V1'),
        },
      );
      expect(request.mock.calls.filter(([options]) => options.url === 'jsTemplateRuntime:resolve')).toHaveLength(2);
      expect(request.mock.calls.filter(([options]) => options.method === 'get')).toHaveLength(2);
    });
  });

  function resolveResponse(data: unknown, artifactUrl = `/api/jsTemplateRuntime:getArtifact/${artifactHash}`) {
    const settings = (data as { settings?: Record<string, unknown> } | undefined)?.settings || {};
    const resolveResult = {
      templateId: 'template_1',
      entryPath: 'src/client/js-actions/example/index.ts',
      artifactHash,
      artifactUrl,
      runtimeCodeHash: 'runtime_hash_v1',
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

  function artifactResponse() {
    const artifact = {
      artifactHash,
      runtimeCodeHash: 'runtime_hash_v1',
      code: "ctx.message.success('ACTION_V1');",
      sourceMap: '{"version":3}',
      runtimeVersion: 'v2',
      entryPath: 'src/client/js-actions/example/index.ts',
      runtimeContract: 'js-template.runtime-artifact.v1',
      byteSize: 64,
    } satisfies JsTemplateArtifact;
    return {
      data: artifact,
    };
  }

  function createApi(request: (options: ApiRequestOptions) => Promise<unknown>): ApiClientLike {
    return {
      request: async <TResponse,>(options: ApiRequestOptions) => (await request(options)) as TResponse,
    };
  }

  function createResolver(request: (options: ApiRequestOptions) => Promise<unknown>) {
    const api = createApi(request);
    return {
      api,
      resolver: createJsTemplateRunJSResolver(api),
    };
  }
}
registerImmutableCacheTests();

// Consolidated from runjs-source-resolver-error-state.cases.tsx.
function registerResolverErrorStateTests() {
  const SOURCE_BINDING = {
    type: 'js-template-entry',
    projectId: 'project_sales',
    templateId: 'template_sales',
    kind: 'js-block',
  };

  describe('JsTemplateRunJSResolver error state', () => {
    it('uses selectable Template metadata as the binding title', async () => {
      const api = {
        request: vi.fn(async () => ({
          data: {
            data: [
              {
                id: 'template_sales',
                projectId: 'project_sales',
                projectName: 'sales-tools',
                projectTitle: 'Sales tools',
                kind: 'js-block',
                templateName: 'sales-kpi',
                title: 'Sales KPI',
              },
            ],
          },
        })),
      };
      const resolver = createJsTemplateRunJSResolver(api);

      await expect(
        resolver.getBindingTitle?.({
          sourceMode: 'js-template',
          sourceBinding: SOURCE_BINDING,
        }),
      ).resolves.toBe('Sales tools / Sales KPI');
      expect(api.request).toHaveBeenCalledWith({
        url: 'jsTemplates:listSelectable',
        method: 'post',
      });
    });

    it('does not revive title metadata for bindings with invalid kind values', async () => {
      const api = {
        request: vi.fn(),
      };
      const resolver = createJsTemplateRunJSResolver(api);

      await expect(
        resolver.getBindingTitle?.({
          sourceMode: 'js-template',
          sourceBinding: {
            ...SOURCE_BINDING,
            kind: 'js-block ',
          },
        }),
      ).resolves.toBeUndefined();
      expect(api.request).not.toHaveBeenCalled();
    });

    it('uses the canonical runtime resolve action and lets request errors surface to the block runtime', async () => {
      const requestError = {
        response: {
          status: 409,
          data: {
            errors: [
              {
                code: 'JS_TEMPLATE_BINDING_OUTDATED',
                message: 'Binding is outdated',
              },
            ],
          },
        },
      };
      const api = {
        request: vi.fn().mockRejectedValue(requestError),
      };
      const resolver = createJsTemplateRunJSResolver(api);

      await expect(
        resolver.resolve({
          sourceMode: 'js-template',
          sourceBinding: SOURCE_BINDING,
          settings: {
            title: 'Sales',
          },
        }),
      ).rejects.toBe(requestError);
      expect(api.request).toHaveBeenCalledWith({
        url: 'jsTemplateRuntime:resolve',
        method: 'post',
        data: {
          sourceMode: 'js-template',
          sourceBinding: SOURCE_BINDING,
          settings: {
            title: 'Sales',
          },
        },
      });
    });

    it('returns the current Template settings descriptor for dynamic JS block settings', async () => {
      const api = {
        request: vi.fn().mockResolvedValue({
          data: {
            data: [
              {
                id: 'template_sales',
                projectId: 'project_sales',
                kind: 'js-block',
                templateName: 'sales-kpi',
                title: 'Sales KPI',
                settingsSchema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      title: 'Message',
                      default: 'Hello',
                    },
                  },
                },
                settingsSchemaHash: 'schema_hash',
                settingsDefaultsHash: 'defaults_hash',
              },
            ],
          },
        }),
      };
      const resolver = createJsTemplateRunJSResolver(api);

      await expect(
        resolver.getSettingsDescriptor?.({
          sourceMode: 'js-template',
          sourceBinding: SOURCE_BINDING,
        }),
      ).resolves.toEqual({
        entryId: 'template_sales',
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              title: 'Message',
              default: 'Hello',
            },
          },
        },
        defaults: {
          message: 'Hello',
        },
        settingsSchemaHash: 'schema_hash',
      });
    });

    it('does not revive settings metadata for bindings with invalid kind values', async () => {
      const api = {
        request: vi.fn(),
      };
      const resolver = createJsTemplateRunJSResolver(api);

      await expect(
        resolver.getSettingsDescriptor?.({
          sourceMode: 'js-template',
          sourceBinding: {
            ...SOURCE_BINDING,
            kind: 'js-block ',
          },
        }),
      ).resolves.toBeUndefined();
      expect(api.request).not.toHaveBeenCalled();
    });
  });
}
registerResolverErrorStateTests();

// Consolidated from runjs-source-resolver-neighbor-isolation.cases.tsx.
function registerNeighborIsolationTests() {
  const render = nbRender;
  const screen = nbScreen;
  const waitFor = nbWaitFor;

  const SOURCE_BINDING = {
    type: 'js-template-entry',
    projectId: 'project_sales',
    templateId: 'template_sales',
    kind: 'js-block',
  };

  function createDeferred<T>() {
    let resolveDeferred!: (value: T) => void;
    const promise = new Promise<T>((resolve) => {
      resolveDeferred = resolve;
    });
    return { promise, resolve: resolveDeferred };
  }

  describe('JS block resolver neighbor isolation', () => {
    afterEach(() => {
      RunJSSourceResolverRegistry.clear();
    });

    it('does not block adjacent inline JS blocks while an external source is loading', async () => {
      const deferred = createDeferred<{ code: string; version: string }>();
      RunJSSourceResolverRegistry.registerResolver({
        sourceMode: 'js-template',
        resolve: () => deferred.promise,
      });
      const engine = new FlowEngine();
      engine.registerModels({ JSBlockModel });
      const external = engine.createModel<JSBlockModel>({
        use: 'JSBlockModel',
        uid: 'external-js-block',
        stepParams: {
          jsSettings: {
            runJs: {
              sourceMode: 'js-template',
              sourceBinding: SOURCE_BINDING,
              settings: {},
              version: 'v2',
            },
          },
        },
      });
      const inline = engine.createModel<JSBlockModel>({
        use: 'JSBlockModel',
        uid: 'inline-js-block',
        stepParams: {
          jsSettings: {
            runJs: {
              code: 'ctx.render(<span data-testid="inline-neighbor">inline neighbor</span>);',
              version: 'v2',
            },
          },
        },
      });

      render(
        <FlowEngineProvider engine={engine}>
          <ConfigProvider>
            <App>
              <FlowModelRenderer model={external} />
              <FlowModelRenderer model={inline} />
            </App>
          </ConfigProvider>
        </FlowEngineProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('inline-neighbor')).toHaveTextContent('inline neighbor');
      });

      deferred.resolve({
        code: 'ctx.render(<span data-testid="external-neighbor">external</span>);',
        version: 'v2',
      });

      await waitFor(() => {
        expect(screen.getByTestId('external-neighbor')).toHaveTextContent('external');
      });
    });
  });
}
registerNeighborIsolationTests();

// Consolidated from runjs-source-resolver-source-mode-errors.cases.tsx.
function registerSourceModeErrorTests() {
  const SchemaField = createSchemaField({
    components: {
      JSBlockJsTemplateSourceField,
    },
  });

  describe('JSBlockJsTemplateSourceField source mode errors', () => {
    beforeEach(() => {
      mocks.request.mockImplementation((options: { url: string }) => {
        if (options.url === 'jsTemplates:listSelectable') {
          return Promise.resolve({
            data: {
              data: [createSelectableTemplate()],
            },
          });
        }

        return Promise.reject(new Error(`Unexpected request: ${options.url}`));
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('keeps inline source mode usable without FlowContext or an API client', async () => {
      const form = createForm({
        initialValues: {
          sourceMode: 'inline',
        },
      });

      render(
        <FormProvider form={form}>
          <SchemaField
            schema={{
              type: 'object',
              properties: {
                sourceMode: {
                  type: 'string',
                  'x-component': 'JSBlockJsTemplateSourceField',
                },
              },
            }}
          />
        </FormProvider>,
      );

      expect(await screen.findByRole('combobox', { name: 'Code source' })).toBeInTheDocument();
      expect(mocks.request).not.toHaveBeenCalled();
    });

    it('sets a settings footer for js-template mode when the inline editor is hidden', async () => {
      const setFooter = vi.fn();
      const close = vi.fn();
      const submit = vi.fn();
      const form = createForm({
        initialValues: {
          sourceMode: 'js-template',
        },
      });

      renderSourceField(form, {
        view: {
          close,
          setFooter,
          submit,
        },
      });

      await waitFor(() => {
        expect(setFooter).toHaveBeenCalledWith(expect.anything());
      });

      const footer = setFooter.mock.calls.find(([node]) => React.isValidElement(node))?.[0];
      expect(footer).toBeTruthy();

      const footerView = render(<>{footer}</>);
      fireEvent.click(footerView.getByRole('button', { name: 'Save' }));
      fireEvent.click(footerView.getByRole('button', { name: 'Cancel' }));

      expect(submit).toHaveBeenCalledTimes(1);
      expect(close).toHaveBeenCalledTimes(1);
      footerView.unmount();
    });

    it('does not duplicate entry settings validation in Code source', async () => {
      const form = createForm({
        initialValues: {
          sourceMode: 'js-template',
          sourceBinding: createSourceBinding(),
          settings: {
            plan: 'pro',
          },
        },
      });

      renderSourceField(form);

      await screen.findByText('Settings are available in separate menus');
      expect(screen.getByText('Settings require attention')).toBeInTheDocument();
      expect(screen.queryByText('plan')).not.toBeInTheDocument();
      expect(getSelfErrors(form.query('sourceMode').take())).toEqual([]);
    });

    it('requires a current Template binding in js-template mode', async () => {
      mocks.request.mockImplementation((options: { url: string }) => {
        if (options.url === 'jsTemplates:listSelectable') {
          return Promise.resolve({
            data: {
              data: [],
            },
          });
        }
        return Promise.reject(new Error(`Unexpected request: ${options.url}`));
      });
      const form = createForm({
        initialValues: {
          sourceMode: 'js-template',
        },
      });

      renderSourceField(form);

      await waitFor(() => {
        expect(getSelfErrors(form.query('sourceMode').take())).toContain('Select a JS Template');
      });
    });

    it('shows only a settings status summary for a valid saved binding', async () => {
      const form = createForm({
        initialValues: {
          sourceMode: 'js-template',
          sourceBinding: createSourceBinding(),
          settings: {},
        },
      });

      renderSourceField(form);

      await waitFor(() => {
        expect(screen.getByText('Settings are available in separate menus')).toBeTruthy();
        expect(screen.getByText('Required settings are complete')).toBeTruthy();
        expect(screen.queryByText('plan')).not.toBeInTheDocument();
        expect(getSelfErrors(form.query('sourceMode').take())).not.toContain('Select a JS Template');
      });
    });

    it('shows a read-only missing-required summary without turning it into a field error', async () => {
      mocks.request.mockImplementation((options: { url: string }) => {
        if (options.url === 'jsTemplates:listSelectable') {
          return Promise.resolve({
            data: {
              data: [
                {
                  ...createSelectableTemplate(),
                  settingsSchema: {
                    type: 'object',
                    required: ['apiKey'],
                    properties: { apiKey: { type: 'string', title: 'API key' } },
                  },
                },
              ],
            },
          });
        }
        return Promise.reject(new Error(`Unexpected request: ${options.url}`));
      });
      const form = createForm({
        initialValues: {
          sourceMode: 'js-template',
          sourceBinding: createSourceBinding(),
          settings: {},
        },
      });

      renderSourceField(form);

      expect(await screen.findByText('Required settings remaining: 1')).toBeInTheDocument();
      expect(screen.queryByText('API key')).not.toBeInTheDocument();
      expect(getSelfErrors(form.query('sourceMode').take())).toEqual([]);
    });

    it('keeps a missing sourceMode compatible with Inline without restoring a stale binding artifact', async () => {
      const form = createForm({
        initialValues: {
          code: 'ctx.render("preserved inline");',
          version: 'v1',
          sourceBinding: {
            ...createSourceBinding(),
          },
        },
      });

      renderSourceField(form);

      await waitFor(() => expect(form.values.sourceMode).toBe('inline'));
      expect(form.values.code).toBe('ctx.render("preserved inline");');
      expect(form.values.version).toBe('v1');
      expect(form.values.sourceBinding).toEqual(createSourceBinding());
      expect(mocks.request.mock.calls.every(([options]) => options.url === 'jsTemplates:listSelectable')).toBe(true);
    });

    it('requests and displays js-block entries for the JS Block selector', async () => {
      mocks.request.mockImplementation((options: { url: string }) => {
        if (options.url === 'jsTemplates:listSelectable') {
          return Promise.resolve({
            data: {
              data: [
                createSelectableTemplate(),
                createSelectableTemplate({ id: 'template_page', kind: 'js-block', templateName: 'page-template' }),
              ],
            },
          });
        }
        return Promise.reject(new Error(`Unexpected request: ${options.url}`));
      });
      const form = createForm({ initialValues: { sourceMode: 'js-template' } });

      renderSourceField(form, {}, 'JSBlockJsTemplateSourceField');

      await waitFor(() => {
        expect(mocks.request).toHaveBeenCalledWith({
          url: 'jsTemplates:listSelectable',
          method: 'post',
        });
      });
      fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Code source' }));
      expect(await screen.findByText('page-template')).toBeInTheDocument();
      expect(screen.getByText('sales')).toBeInTheDocument();
    });

    it('shows translated empty and generic request error states without leaking server details', async () => {
      mocks.request.mockRejectedValue(new Error('private binding source text'));
      const form = createForm({ initialValues: { sourceMode: 'js-template' } });

      renderSourceField(form, {}, 'JSBlockJsTemplateSourceField', 'sourceBinding');

      expect(await screen.findByText('Failed to load templates')).toBeInTheDocument();
      expect(screen.queryByText('private binding source text')).not.toBeInTheDocument();
      fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Code source' }));
      expect(await screen.findByText('No JS Templates')).toBeInTheDocument();
    });
  });

  function renderSourceField(
    form: ReturnType<typeof createForm>,
    context: {
      view?: {
        close?: () => void;
        setFooter?: (footer: React.ReactNode) => void;
        submit?: () => void | Promise<void>;
      };
    } = {},
    component = 'JSBlockJsTemplateSourceField',
    fieldName = 'sourceMode',
  ) {
    const engine = new FlowEngine();
    engine.context.defineProperty('api', {
      value: {
        request: mocks.request,
      },
    });
    if (context.view) {
      engine.context.defineProperty('view', {
        value: context.view,
      });
    }

    return render(
      <FlowEngineProvider engine={engine}>
        <FormProvider form={form}>
          <SchemaField
            schema={{
              type: 'object',
              properties: {
                [fieldName]: {
                  type: 'string',
                  'x-component': component,
                },
              },
            }}
          />
        </FormProvider>
      </FlowEngineProvider>,
    );
  }

  function createSourceBinding() {
    return {
      type: 'js-template-entry',
      projectId: 'project_sales',
      templateId: 'template_sales',
      kind: 'js-block',
    };
  }

  function createSelectableTemplate(options: { id?: string; kind?: 'js-block'; templateName?: string } = {}) {
    const id = options.id || 'template_sales';
    const kind = options.kind || 'js-block';
    const templateName = options.templateName || 'sales';
    return {
      id,
      projectId: 'project_sales',
      target: 'client',
      kind,
      templateName,
      entryPath: `src/client/${kind}/${templateName}/index.tsx`,
      descriptorPath: `src/client/${kind}/${templateName}/entry.json`,
      title: 'Sales',
      description: null,
      category: null,
      icon: null,
      tags: null,
      sort: null,
      runtimeAvailable: true,
      settingsSchema: {
        type: 'object',
        properties: {
          plan: {
            type: 'string',
            enum: ['basic'],
            default: 'basic',
          },
        },
      },
      settingsSchemaHash: 'schema_hash',
      compiledCommitId: 'commit_sales',
      runtimeArtifact: {
        code: 'ctx.render("sales");',
        version: 'v2',
        entryPath: 'src/client/js-blocks/sales/index.tsx',
      },
      runtimeVersion: 'v2',
      surfaceStyle: 'render',
      runtimeCodeHash: 'runtime_hash',
      filesHash: 'files_hash',
      settingsDefaultsHash: 'defaults_hash',
      compiledAt: '2026-07-09T00:00:00.000Z',
      healthStatus: 'ready',
      diagnostics: [],
    };
  }

  function getSelfErrors(field: unknown): string[] {
    if (!field || typeof field !== 'object' || !('selfErrors' in field)) {
      return [];
    }
    const errors = (field as { selfErrors?: unknown }).selfErrors;
    return Array.isArray(errors) ? errors.filter((error): error is string => typeof error === 'string') : [];
  }
}
registerSourceModeErrorTests();
