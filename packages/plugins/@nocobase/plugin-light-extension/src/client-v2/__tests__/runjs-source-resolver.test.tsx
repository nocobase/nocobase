/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { type ApiClientLike, type ApiRequestOptions } from '../api/lightExtensionEntriesRequests';
import {
  JSBlockLightExtensionSourceField,
  JSPageLightExtensionSourceField,
} from '../components/JSBlockLightExtensionSourceField';
import { createLightExtensionRunJSResolver } from '../resolvers/LightExtensionRunJSResolver';
import { invalidateLightExtensionRuntimeCache } from '../resolvers/LightExtensionRuntimeCacheRegistry';
import { createForm } from '@formily/core';
import { createSchemaField, FormProvider } from '@formily/react';
import { JSBlockModel, RunJSSourceResolverRegistry } from '@nocobase/client-v2';
import { FlowEngine, FlowEngineProvider, FlowModelRenderer } from '@nocobase/flow-engine';
import { render as nbRender, screen as nbScreen, waitFor as nbWaitFor } from '@nocobase/test/client';
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

// Consolidated from runjs-source-resolver-immutable-cache.cases.ts.
function registerImmutableCacheTests() {
  const artifactHash = 'a'.repeat(64);
  const sourceBinding = {
    type: 'light-extension-entry',
    repoId: 'repo_1',
    entryId: 'entry_1',
    kind: 'js-action',
  } as const;

  describe('light extension immutable artifact cache', () => {
    it('accepts a proxied source binding from flow model state', async () => {
      const request = vi.fn(async (options: ApiRequestOptions) => {
        return options.method === 'get' ? artifactResponse() : resolveResponse(options.data);
      });
      const { resolver } = createResolver(request);
      const proxiedSourceBinding = new Proxy(sourceBinding, {});

      await expect(
        resolver.resolve({ sourceMode: 'light-extension', sourceBinding: proxiedSourceBinding, settings: {} }),
      ).resolves.toMatchObject({ code: expect.stringContaining('ACTION_V1') });
      expect(request.mock.calls.find(([options]) => options.method === 'post')?.[0].data).toMatchObject({
        sourceBinding,
      });
    });

    it('fetches artifacts through the API client when resolve returns a custom prefixed URL', async () => {
      const request = vi.fn(async (options: ApiRequestOptions) => {
        return options.method === 'get'
          ? artifactResponse()
          : resolveResponse(options.data, `/foo/api/light-extension-runtime/artifacts/${artifactHash}`);
      });
      const { resolver } = createResolver(request);

      await expect(
        resolver.resolve({ sourceMode: 'light-extension', sourceBinding, settings: {} }),
      ).resolves.toMatchObject({
        code: expect.stringContaining('ACTION_V1'),
      });

      expect(request.mock.calls.find(([options]) => options.method === 'get')?.[0].url).toBe(
        `/light-extension-runtime/artifacts/${artifactHash}`,
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

      await resolver.resolve({ sourceMode: 'light-extension', sourceBinding, settings: {} });
      invalidateLightExtensionRuntimeCache(api, sourceBinding.repoId);
      await expect(resolver.resolve({ sourceMode: 'light-extension', sourceBinding, settings: {} })).rejects.toThrow(
        'repo disabled',
      );
    });

    it('does not retain domain errors after the in-flight request settles', async () => {
      const request = vi.fn(async () => {
        throw Object.assign(new Error('permission denied'), { code: 'LIGHT_EXTENSION_PERMISSION_DENIED' });
      });
      const { resolver } = createResolver(request);

      await expect(
        resolver.resolve({ sourceMode: 'light-extension', sourceBinding, settings: {} }),
      ).rejects.toMatchObject({ code: 'LIGHT_EXTENSION_PERMISSION_DENIED' });
      await expect(
        resolver.resolve({ sourceMode: 'light-extension', sourceBinding, settings: {} }),
      ).rejects.toMatchObject({ code: 'LIGHT_EXTENSION_PERMISSION_DENIED' });
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

      await expect(
        resolver.resolve({ sourceMode: 'light-extension', sourceBinding, settings: {} }),
      ).resolves.toMatchObject({
        code: expect.stringContaining('ACTION_V1'),
      });
      expect(request.mock.calls.filter(([options]) => options.url === '/light-extension-runtime/resolve')).toHaveLength(
        2,
      );
      expect(request.mock.calls.filter(([options]) => options.method === 'get')).toHaveLength(2);
    });
  });

  function resolveResponse(data: unknown, artifactUrl = `/api/light-extension-runtime/artifacts/${artifactHash}`) {
    const settings = (data as { settings?: Record<string, unknown> } | undefined)?.settings || {};
    return {
      data: {
        data: {
          entryId: 'entry_1',
          entryPath: 'src/client/js-actions/example/index.ts',
          artifactHash,
          artifactUrl,
          runtimeCodeHash: 'runtime_hash_v1',
          version: 'v2',
          settings,
          settingsHash: 'settings_hash',
        },
      },
    };
  }

  function artifactResponse() {
    return {
      data: {
        artifactHash,
        runtimeCodeHash: 'runtime_hash_v1',
        code: "ctx.message.success('ACTION_V1');",
        sourceMap: '{"version":3}',
        version: 'v2',
        entryPath: 'src/client/js-actions/example/index.ts',
        runtimeContract: 'light-extension.runtime-artifact.v1',
        byteSize: 64,
      },
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
      resolver: createLightExtensionRunJSResolver(api),
    };
  }
}
registerImmutableCacheTests();

// Consolidated from runjs-source-resolver-error-state.cases.tsx.
function registerResolverErrorStateTests() {
  const SOURCE_BINDING = {
    type: 'light-extension-entry',
    repoId: 'repo_sales',
    entryId: 'entry_sales',
    kind: 'js-block',
  };

  describe('LightExtensionRunJSResolver error state', () => {
    it('uses selectable entry metadata as the binding title', async () => {
      const api = {
        request: vi.fn(async () => ({
          data: {
            data: [
              {
                id: 'entry_sales',
                repoId: 'repo_sales',
                repoName: 'sales-tools',
                repoTitle: 'Sales tools',
                kind: 'js-block',
                entryName: 'sales-kpi',
                title: 'Sales KPI',
              },
            ],
          },
        })),
      };
      const resolver = createLightExtensionRunJSResolver(api);

      await expect(
        resolver.getBindingTitle?.({
          sourceMode: 'light-extension',
          sourceBinding: SOURCE_BINDING,
        }),
      ).resolves.toBe('Sales tools / sales-kpi');
      expect(api.request).toHaveBeenCalledWith({
        url: 'lightExtensionEntries:listSelectable',
        method: 'post',
      });
    });

    it('does not revive title metadata for bindings with invalid kind values', async () => {
      const api = {
        request: vi.fn(),
      };
      const resolver = createLightExtensionRunJSResolver(api);

      await expect(
        resolver.getBindingTitle?.({
          sourceMode: 'light-extension',
          sourceBinding: {
            ...SOURCE_BINDING,
            kind: 'js-block ',
            entryTitle: 'Stale title',
            entryName: 'stale-entry',
          },
        }),
      ).resolves.toBeUndefined();
      expect(api.request).not.toHaveBeenCalled();
    });

    it('uses the documented runtime resolve route and lets request errors surface to the block runtime', async () => {
      const requestError = {
        response: {
          status: 409,
          data: {
            errors: [
              {
                code: 'LIGHT_EXTENSION_BINDING_OUTDATED',
                message: 'Binding is outdated',
              },
            ],
          },
        },
      };
      const api = {
        request: vi.fn().mockRejectedValue(requestError),
      };
      const resolver = createLightExtensionRunJSResolver(api);

      await expect(
        resolver.resolve({
          sourceMode: 'light-extension',
          sourceBinding: SOURCE_BINDING,
          settings: {
            title: 'Sales',
          },
        }),
      ).rejects.toBe(requestError);
      expect(api.request).toHaveBeenCalledWith({
        url: '/light-extension-runtime/resolve',
        method: 'post',
        data: {
          sourceMode: 'light-extension',
          sourceBinding: SOURCE_BINDING,
          settings: {
            title: 'Sales',
          },
        },
      });
    });

    it('returns the current entry settings descriptor for dynamic JS block settings', async () => {
      const api = {
        request: vi.fn().mockResolvedValue({
          data: {
            data: [
              {
                id: 'entry_sales',
                repoId: 'repo_sales',
                kind: 'js-block',
                entryName: 'sales-kpi',
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
      const resolver = createLightExtensionRunJSResolver(api);

      await expect(
        resolver.getSettingsDescriptor?.({
          sourceMode: 'light-extension',
          sourceBinding: SOURCE_BINDING,
        }),
      ).resolves.toEqual({
        entryId: 'entry_sales',
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
      const resolver = createLightExtensionRunJSResolver(api);

      await expect(
        resolver.getSettingsDescriptor?.({
          sourceMode: 'light-extension',
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
    type: 'light-extension-entry',
    repoId: 'repo_sales',
    entryId: 'entry_sales',
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
        sourceMode: 'light-extension',
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
              sourceMode: 'light-extension',
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
      JSBlockLightExtensionSourceField,
      JSPageLightExtensionSourceField,
    },
  });

  describe('JSBlockLightExtensionSourceField source mode errors', () => {
    beforeEach(() => {
      mocks.request.mockImplementation((options: { url: string }) => {
        if (options.url === 'lightExtensionEntries:listSelectable') {
          return Promise.resolve({
            data: {
              data: [createSelectableEntry()],
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
                  'x-component': 'JSBlockLightExtensionSourceField',
                },
              },
            }}
          />
        </FormProvider>,
      );

      expect(await screen.findByRole('combobox', { name: 'Code source' })).toBeInTheDocument();
      expect(mocks.request).not.toHaveBeenCalled();
    });

    it('sets a settings footer for light-extension mode when the inline editor is hidden', async () => {
      const setFooter = vi.fn();
      const close = vi.fn();
      const submit = vi.fn();
      const form = createForm({
        initialValues: {
          sourceMode: 'light-extension',
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

    it('does not duplicate entry settings validation in Code source and clears binding errors in inline mode', async () => {
      const form = createForm({
        initialValues: {
          sourceMode: 'light-extension',
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

      fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Code source' }));
      fireEvent.click(await screen.findByText('Inline code'));
      fireEvent.click(await screen.findByText('Keep existing code'));

      await waitFor(() => {
        expect(form.values.sourceMode).toBe('inline');
        expect(getSelfErrors(form.query('sourceMode').take())).toEqual([]);
      });
    });

    it('requires a current entry binding in light-extension mode', async () => {
      mocks.request.mockImplementation((options: { url: string }) => {
        if (options.url === 'lightExtensionEntries:listSelectable') {
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
          sourceMode: 'light-extension',
        },
      });

      renderSourceField(form);

      await waitFor(() => {
        expect(getSelfErrors(form.query('sourceMode').take())).toContain('Select a light extension entry');
      });
    });

    it('shows only a settings status summary for a valid saved binding', async () => {
      const form = createForm({
        initialValues: {
          sourceMode: 'light-extension',
          sourceBinding: createSourceBinding(),
          settings: {},
        },
      });

      renderSourceField(form);

      await waitFor(() => {
        expect(screen.getByText('Settings are available in separate menus')).toBeTruthy();
        expect(screen.getByText('Required settings are complete')).toBeTruthy();
        expect(screen.queryByText('plan')).not.toBeInTheDocument();
        expect(getSelfErrors(form.query('sourceMode').take())).not.toContain('Select a light extension entry');
      });
    });

    it('shows a read-only missing-required summary without turning it into a field error', async () => {
      mocks.request.mockImplementation((options: { url: string }) => {
        if (options.url === 'lightExtensionEntries:listSelectable') {
          return Promise.resolve({
            data: {
              data: [
                {
                  ...createSelectableEntry(),
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
          sourceMode: 'light-extension',
          sourceBinding: createSourceBinding(),
          settings: {},
        },
      });

      renderSourceField(form);

      expect(await screen.findByText('Required settings remaining: 1')).toBeInTheDocument();
      expect(screen.queryByText('API key')).not.toBeInTheDocument();
      expect(getSelfErrors(form.query('sourceMode').take())).toEqual([]);
    });

    it('does not copy invalid source bindings in inline mode', async () => {
      const form = createForm({
        initialValues: {
          sourceMode: 'inline',
          sourceBinding: {
            ...createSourceBinding(),
            kind: 'js-action',
          },
        },
      });

      renderSourceField(form);

      expect(screen.getByText('Copy selected light extension code').closest('button')).toHaveProperty('disabled', true);
      fireEvent.click(screen.getByText('Copy selected light extension code'));

      expect(mocks.request).not.toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/light-extension-runtime/resolve',
        }),
      );
    });

    it('requests and displays only js-page entries for the JS Page selector', async () => {
      mocks.request.mockImplementation((options: { url: string }) => {
        if (options.url === 'lightExtensionEntries:listSelectable') {
          return Promise.resolve({
            data: {
              data: [
                createSelectableEntry(),
                createSelectableEntry({ id: 'entry_page', kind: 'js-page', entryName: 'page-entry' }),
              ],
            },
          });
        }
        return Promise.reject(new Error(`Unexpected request: ${options.url}`));
      });
      const form = createForm({ initialValues: { sourceMode: 'light-extension' } });

      renderSourceField(form, {}, 'JSPageLightExtensionSourceField');

      await waitFor(() => {
        expect(mocks.request).toHaveBeenCalledWith({
          url: 'lightExtensionEntries:listSelectable',
          method: 'post',
        });
      });
      fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Code source' }));
      expect(await screen.findByText('page-entry')).toBeInTheDocument();
      expect(screen.queryByText('sales')).not.toBeInTheDocument();
    });

    it('shows translated empty and generic request error states without leaking server details', async () => {
      mocks.request.mockRejectedValue(new Error('private binding source text'));
      const form = createForm({ initialValues: { sourceMode: 'light-extension' } });

      renderSourceField(form, {}, 'JSPageLightExtensionSourceField', 'sourceBinding');

      expect(await screen.findByText('Failed to load entries')).toBeInTheDocument();
      expect(screen.queryByText('private binding source text')).not.toBeInTheDocument();
      fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Code source' }));
      expect(await screen.findByText('No light extension entries')).toBeInTheDocument();
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
    component = 'JSBlockLightExtensionSourceField',
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
      type: 'light-extension-entry',
      repoId: 'repo_sales',
      entryId: 'entry_sales',
      kind: 'js-block',
    };
  }

  function createSelectableEntry(options: { id?: string; kind?: 'js-block' | 'js-page'; entryName?: string } = {}) {
    const id = options.id || 'entry_sales';
    const kind = options.kind || 'js-block';
    const entryName = options.entryName || 'sales';
    return {
      id,
      repoId: 'repo_sales',
      target: 'client',
      kind,
      entryName,
      entryPath: `src/client/${kind}/${entryName}/index.tsx`,
      descriptorPath: `src/client/${kind}/${entryName}/entry.json`,
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
