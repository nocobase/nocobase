/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { App, ConfigProvider } from 'antd';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@nocobase/test/client';
import {
  FlowEngine,
  FlowEngineProvider,
  FlowModelRenderer,
  FlowRuntimeContext,
  resolveRuntimeFlowSettingSteps,
  type FlowSettingsContext,
} from '@nocobase/flow-engine';
import {
  RunJSSettingsDescriptorProviderRegistry,
  RunJSSourceResolverRegistry,
  type RunJSSourceSettingsDescriptor,
} from '../../../../components/runjs-source';
import { RunJSEditorRegistry } from '../../../../components/runjs-studio';
import { PluginFlowEngine } from '../../../../index';
import { createMockClient } from '../../../../../MockApplication';
import { JSBlockModel } from '../JSBlock';
import { JSBlockSourceModeField } from '../JSBlockSourceModeField';

const SOURCE_BINDING = {
  type: 'js-template-entry',
  projectId: 'jtp_sales',
  templateId: 'jtt_sales',
  kind: 'js-block',
};

const SETTINGS_DESCRIPTOR = {
  entryId: 'jtt_sales',
  settingsSchemaHash: 'schema_active',
  defaults: {
    message: 'Hello',
    pageSize: 5,
    enabled: true,
  },
  schema: {
    type: 'object',
    required: ['message'],
    properties: {
      message: {
        type: 'string',
        title: 'Message',
      },
      pageSize: {
        type: 'integer',
        title: 'Page size',
      },
      enabled: {
        type: 'boolean',
        title: 'Enabled',
      },
    },
  },
};

function renderJSBlock(stepParams: Record<string, unknown>) {
  const engine = new FlowEngine();
  engine.registerModels({ JSBlockModel });
  const model = engine.createModel<JSBlockModel>({
    use: 'JSBlockModel',
    uid: `js-block-${Math.random()}`,
    stepParams: {
      jsSettings: {
        runJs: stepParams,
      },
    },
  });

  render(
    <FlowEngineProvider engine={engine}>
      <ConfigProvider>
        <App>
          <FlowModelRenderer model={model} />
        </App>
      </ConfigProvider>
    </FlowEngineProvider>,
  );

  return model;
}

describe('JSBlockModel JS Template source', () => {
  afterEach(() => {
    RunJSEditorRegistry.clear();
    RunJSSettingsDescriptorProviderRegistry.clear();
    RunJSSourceResolverRegistry.clear();
  });

  it('registers a core fallback source field when the JS Template plugin is not loaded', async () => {
    const app = createMockClient({
      ws: false,
      plugins: [
        [
          PluginFlowEngine,
          {
            name: 'flow-engine',
          },
        ],
      ],
    });

    await app.load();

    expect(app.flowEngine.flowSettings.components.JSBlockJsTemplateSourceField).toBe(JSBlockSourceModeField);
  });

  it('uses the cascade source picker in the block settings menu', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ JSBlockModel });
    const model = engine.createModel<JSBlockModel>({
      use: 'JSBlockModel',
      uid: 'js-block-settings-schema',
    });
    const runJsStep = model.getFlow('jsSettings')?.steps?.runJs as {
      uiSchema?: Record<string, Record<string, unknown>>;
      uiMode?: (
        ctx: FlowRuntimeContext<JSBlockModel>,
      ) =>
        | { props?: { footer?: unknown; title?: unknown } }
        | Promise<{ props?: { footer?: unknown; title?: unknown } }>;
    };
    const sourceModeStep = model.getFlow('jsSettings')?.steps?.sourceMode as {
      title?: string;
      uiMode?: {
        type?: string;
        key?: string;
        props?: {
          searchPlaceholder?: string;
          loadItems?: (input: {
            params: Record<string, unknown>;
            defaultParams: Record<string, unknown>;
            t: (key: string) => string;
          }) => Promise<Array<{ key: string; label: string }>>;
          getDisplayLabel?: (input: { params: Record<string, unknown>; t: (key: string) => string }) => React.ReactNode;
        };
      };
      useRawParams?: boolean;
      uiSchema?: Record<string, Record<string, unknown>>;
      defaultParams?: (ctx: typeof model.context) => Record<string, unknown> | Promise<Record<string, unknown>>;
      beforeParamsSave?: (
        ctx: typeof model.context,
        params: Record<string, unknown>,
        previousParams: unknown,
      ) => void | Promise<void>;
      afterParamsSave?: (ctx: typeof model.context, params: Record<string, unknown>, previousParams: unknown) => void;
    };

    expect(sourceModeStep?.title).toBe('{{t("Code source")}}');
    expect(sourceModeStep?.uiMode).toMatchObject({
      type: 'cascadeMenu',
      key: 'sourceMode',
      props: {
        searchPlaceholder: 'Search JS Templates',
      },
    });
    expect(sourceModeStep?.uiMode?.props?.loadItems).toBeTypeOf('function');
    expect(sourceModeStep?.uiMode?.props?.getDisplayLabel).toBeTypeOf('function');
    const displayLabel = sourceModeStep?.uiMode?.props?.getDisplayLabel?.({
      params: {
        sourceMode: 'js-template',
        sourceBinding: SOURCE_BINDING,
      },
      t: (key: string) => key,
    });
    render(<>{displayLabel}</>);
    expect(screen.getByText('jtp_sales / jtt_sales')).toBeInTheDocument();
    expect(sourceModeStep?.useRawParams).toBe(true);
    expect(sourceModeStep?.uiSchema).toBeUndefined();
    expect(await sourceModeStep.defaultParams?.(model.context)).toEqual({
      sourceMode: 'inline',
      sourceBinding: undefined,
      settings: {},
    });
    expect(runJsStep?.uiSchema?.sourceMode?.['x-display']).toBe('hidden');
    expect(runJsStep?.uiSchema?.sourceMode?.['x-component']).toBeUndefined();
    expect(runJsStep?.uiSchema?.sourceBinding?.['x-display']).toBe('hidden');
    expect(runJsStep?.uiSchema?.settings?.['x-display']).toBe('hidden');
    expect(runJsStep?.uiSchema?.settings?.['x-visible']).toBeUndefined();
    expect(runJsStep?.uiSchema?.code?.['x-component']).toBeTypeOf('function');
    expect(runJsStep?.uiSchema?.code?.['x-reactions']).toBeUndefined();
    const runJsUiMode = await runJsStep?.uiMode?.(new FlowRuntimeContext(model, 'jsSettings', 'settings'));
    expect(runJsUiMode?.props?.footer).toBeUndefined();
    expect(model.getFlow('jsSettings')?.steps?.jsTemplateSource).toBeUndefined();
  });

  it('resolves source binding names when persisted bindings only contain technical keys', async () => {
    const getBindingTitle = vi.fn(async () => 'browser-feedback-fixture / example');
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'js-template',
      resolve: () => ({ code: '' }),
      getBindingTitle,
    });
    const engine = new FlowEngine();
    engine.registerModels({ JSBlockModel });
    const model = engine.createModel<JSBlockModel>({
      use: 'JSBlockModel',
      uid: 'js-block-source-binding-name',
    });
    const sourceModeStep = model.getFlow('jsSettings')?.steps?.sourceMode as {
      uiMode?: {
        props?: {
          getDisplayLabel?: (input: { params: Record<string, unknown>; t: (key: string) => string }) => React.ReactNode;
        };
      };
    };

    const displayLabel = sourceModeStep.uiMode?.props?.getDisplayLabel?.({
      params: {
        sourceMode: 'js-template',
        sourceBinding: {
          type: 'js-template-entry',
          projectId: 'jtp_zq9sgc3i7qh',
          templateId: 'jtt_hpujrt4yyie',
          kind: 'js-block',
        },
      },
      t: (key) => key,
    });
    render(<>{displayLabel}</>);

    expect(screen.getByText('jtp_zq9sgc3i7qh / jtt_hpujrt4yyie')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('browser-feedback-fixture / example')).toBeInTheDocument();
    });
    expect(getBindingTitle).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceMode: 'js-template',
        sourceBinding: expect.objectContaining({
          projectId: 'jtp_zq9sgc3i7qh',
          templateId: 'jtt_hpujrt4yyie',
        }),
      }),
    );
  });

  it('loads inline and resolver-backed source menu items for JS Block', async () => {
    const listSourceMenuItems = vi.fn(async () => [
      {
        key: 'js-template',
        label: 'JS Template',
      },
    ]);
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'js-template',
      resolve: () => ({
        code: 'ctx.render("ok");',
      }),
      listSourceMenuItems,
    });
    const engine = new FlowEngine();
    engine.registerModels({ JSBlockModel });
    const model = engine.createModel<JSBlockModel>({
      use: 'JSBlockModel',
      uid: 'js-block-source-menu-items',
    });
    const sourceModeStep = model.getFlow('jsSettings')?.steps?.sourceMode as {
      uiMode?: {
        props?: {
          loadItems?: (input: {
            params: Record<string, unknown>;
            defaultParams: Record<string, unknown>;
            t: (key: string) => string;
          }) => Promise<Array<{ key: string; label: string }>>;
        };
      };
    };

    const items = await sourceModeStep.uiMode?.props?.loadItems?.({
      params: {
        sourceMode: 'inline',
      },
      defaultParams: {},
      t: (key) => key,
    });

    expect(items?.map((item) => item.key)).toEqual(['inline', 'js-template']);
    expect(listSourceMenuItems).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'js-block',
        sourceMode: 'inline',
      }),
    );
  });

  it('uses the canonical template identity in the RunJS drawer title while the resolver is unavailable', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ JSBlockModel });
    const model = engine.createModel<JSBlockModel>({
      use: 'JSBlockModel',
      uid: 'js-block-runjs-title',
      stepParams: {
        jsSettings: {
          runJs: {
            sourceMode: 'js-template',
            sourceBinding: SOURCE_BINDING,
          },
        },
      },
    });
    const runJsStep = model.getFlow('jsSettings')?.steps?.runJs as {
      uiMode?: (
        ctx: FlowRuntimeContext<JSBlockModel>,
      ) => { props?: { title?: unknown } } | Promise<{ props?: { title?: unknown } }>;
    };

    const uiMode = await runJsStep.uiMode?.(new FlowRuntimeContext(model, 'jsSettings', 'settings'));
    expect(uiMode?.props?.title).toBe('Write JavaScript (JS Template: jtt_sales)');
  });

  it('resolves canonical JS Template names through the RunJS source resolver', async () => {
    const getBindingTitle = vi.fn(async () => 'Sales KPI');
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'js-template',
      getBindingTitle,
      resolve: () => ({
        code: 'ctx.render("sales");',
      }),
    });
    const engine = new FlowEngine();
    engine.registerModels({ JSBlockModel });
    const model = engine.createModel<JSBlockModel>({
      use: 'JSBlockModel',
      uid: 'js-block-runjs-title-resolver',
      stepParams: {
        jsSettings: {
          runJs: {
            sourceMode: 'js-template',
            sourceBinding: SOURCE_BINDING,
          },
        },
      },
    });
    const runJsStep = model.getFlow('jsSettings')?.steps?.runJs as {
      uiMode?: (
        ctx: FlowRuntimeContext<JSBlockModel>,
      ) => { props?: { title?: unknown } } | Promise<{ props?: { title?: unknown } }>;
    };

    const uiMode = await runJsStep.uiMode?.(new FlowRuntimeContext(model, 'jsSettings', 'settings'));

    expect(uiMode?.props?.title).toBe('Write JavaScript (JS Template: Sales KPI)');
    expect(getBindingTitle).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceMode: 'js-template',
        sourceBinding: SOURCE_BINDING,
      }),
    );
  });

  it('syncs menu code source changes into the RunJS step and refreshes rendering', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'js-template',
      resolve: () => ({ code: '' }),
      getSettingsDescriptor: async () => SETTINGS_DESCRIPTOR,
    });
    const engine = new FlowEngine();
    engine.registerModels({ JSBlockModel });
    const model = engine.createModel<JSBlockModel>({
      use: 'JSBlockModel',
      uid: 'js-block-source-menu-sync',
      stepParams: {
        jsSettings: {
          runJs: {
            sourceMode: 'inline',
            code: 'ctx.render("inline");',
            version: 'v2',
          },
        },
      },
    });
    const sourceModeStep = model.getFlow('jsSettings')?.steps?.sourceMode as {
      beforeParamsSave?: (ctx: typeof model.context, params: Record<string, unknown>, previousParams: unknown) => void;
      afterParamsSave?: (ctx: typeof model.context, params: Record<string, unknown>, previousParams: unknown) => void;
    };
    const invalidateSpy = vi.spyOn(model, 'invalidateFlowCache');
    const rerenderSpy = vi.spyOn(model, 'rerender').mockResolvedValue(undefined);

    await sourceModeStep.beforeParamsSave?.(
      model.context,
      {
        sourceMode: 'js-template',
        sourceBinding: SOURCE_BINDING,
        settings: {
          stale: 'Sales',
        },
      },
      {},
    );

    expect(model.getStepParams('jsSettings', 'runJs')).toMatchObject({
      sourceMode: 'js-template',
      sourceBinding: SOURCE_BINDING,
      settings: {},
      code: 'ctx.render("inline");',
      version: 'v2',
    });

    await sourceModeStep.afterParamsSave?.(model.context, { sourceMode: 'js-template' }, {});

    expect(invalidateSpy).toHaveBeenCalledWith('beforeRender', true);
    expect(rerenderSpy).toHaveBeenCalled();
  });

  it('allows switching a js-template-only block to empty inline code', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'js-template',
      resolve: () => ({ code: 'ctx.render("remote");' }),
      getSettingsDescriptor: async () => SETTINGS_DESCRIPTOR,
    });
    const engine = new FlowEngine();
    engine.registerModels({ JSBlockModel });
    const model = engine.createModel<JSBlockModel>({
      use: 'JSBlockModel',
      uid: 'js-block-source-menu-switch-to-inline',
      stepParams: {
        jsSettings: {
          runJs: {
            sourceMode: 'js-template',
            sourceBinding: SOURCE_BINDING,
            settings: { title: 'Sales' },
            version: 'v2',
          },
        },
      },
    });
    const sourceModeStep = model.getFlow('jsSettings')?.steps?.sourceMode as {
      beforeParamsSave?: (ctx: typeof model.context, params: Record<string, unknown>, previousParams: unknown) => void;
    };

    await sourceModeStep.beforeParamsSave?.(
      model.context,
      {
        sourceMode: 'inline',
        sourceBinding: undefined,
        settings: { title: 'Sales' },
      },
      {},
    );

    expect(model.getStepParams('jsSettings', 'runJs')).toEqual({
      sourceMode: 'inline',
      code: '',
      settings: { title: 'Sales' },
      version: 'v2',
    });
  });

  it('does not generate runtime settings steps for inline JS blocks', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ JSBlockModel });
    const model = engine.createModel<JSBlockModel>({
      use: 'JSBlockModel',
      uid: 'js-block-inline-no-runtime-settings',
      stepParams: {
        jsSettings: {
          runJs: {
            sourceMode: 'inline',
          },
        },
      },
    });

    await expect(model.getRuntimeFlowSettingSteps('jsSettings')).resolves.toBeUndefined();
  });

  it('generates inline runtime settings steps from src/client/entry.json while preserving falsy values', async () => {
    const getSettingsDescriptor = vi.fn(async () => SETTINGS_DESCRIPTOR);
    RunJSSettingsDescriptorProviderRegistry.registerProvider({
      key: 'inline-js-template',
      canHandle: (input) => input.sourceMode === 'inline',
      getSettingsDescriptor,
    });
    const engine = new FlowEngine();
    engine.registerModels({ JSBlockModel });
    const model = engine.createModel<JSBlockModel>({
      use: 'JSBlockModel',
      uid: 'js-block-inline-runtime-settings',
      stepParams: {
        jsSettings: {
          runJs: {
            code: 'ctx.render(<div />);',
            version: 'v2',
            sourceMode: 'inline',
            sourceRef: {
              type: 'vsc-file',
              repoId: 'repo_inline',
              commitId: 'commit_inline',
              entry: 'src/client/index.tsx',
            },
            settings: {
              message: '',
              pageSize: 0,
              enabled: false,
            },
          },
        },
      },
    });

    const steps = await model.getRuntimeFlowSettingSteps('jsSettings');

    expect(Object.values(steps || {}).map((step) => step.title)).toEqual(['Message', 'Page size', 'Enabled']);
    expect(
      Object.fromEntries(
        Object.values(steps || {}).map((step) => [
          step.title,
          typeof step.defaultParams === 'function' ? step.defaultParams({} as never).value : undefined,
        ]),
      ),
    ).toEqual({ Message: '', 'Page size': 0, Enabled: false });
    expect(getSettingsDescriptor).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceMode: 'inline',
        sourceRef: expect.objectContaining({ repoId: 'repo_inline', commitId: 'commit_inline' }),
        locator: {
          kind: 'flowModel.step',
          modelUid: 'js-block-inline-runtime-settings',
          flowKey: 'jsSettings',
          stepKey: 'runJs',
          paramPath: ['code'],
          versionPath: ['version'],
        },
      }),
    );
  });

  it('keeps static settings available when the inline descriptor request fails', async () => {
    RunJSSettingsDescriptorProviderRegistry.registerProvider({
      key: 'inline-js-template',
      getSettingsDescriptor: async () => {
        throw new Error('workspace unavailable');
      },
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const engine = new FlowEngine();
    engine.registerModels({ JSBlockModel });
    const model = engine.createModel<JSBlockModel>({
      use: 'JSBlockModel',
      uid: 'js-block-inline-settings-failure',
      stepParams: {
        jsSettings: {
          runJs: {
            sourceMode: 'inline',
            sourceRef: { type: 'vsc-file', repoId: 'repo_inline', commitId: 'commit_inline' },
          },
        },
      },
    });

    await expect(resolveRuntimeFlowSettingSteps(model, 'jsSettings')).resolves.toEqual({});
    expect(warn).toHaveBeenCalledWith(
      "FlowSettings: failed to resolve runtime setting steps for flow 'jsSettings'.",
      expect.objectContaining({ message: 'workspace unavailable' }),
    );
  });

  it('validates nested object settings before saving a runtime settings step', async () => {
    const descriptor: RunJSSourceSettingsDescriptor = {
      entryId: 'jtt_object_settings',
      settingsSchemaHash: 'schema_object_settings',
      defaults: {},
      schema: {
        type: 'object',
        properties: {
          options: {
            type: 'object',
            title: 'Options',
            required: ['limit'],
            default: {
              label: 'Object default',
            },
            properties: {
              limit: {
                type: 'integer',
                title: 'Limit',
                default: 5,
              },
              label: {
                type: 'string',
              },
            },
          },
        },
      },
    };

    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'js-template',
      getSettingsDescriptor: vi.fn(async () => descriptor),
      resolve: () => ({
        code: 'ctx.render("sales");',
      }),
    });

    const engine = new FlowEngine();
    engine.registerModels({ JSBlockModel });
    const model = engine.createModel<JSBlockModel>({
      use: 'JSBlockModel',
      uid: 'js-block-runtime-settings-object-validation',
      stepParams: {
        jsSettings: {
          runJs: {
            sourceMode: 'js-template',
            sourceBinding: SOURCE_BINDING,
          },
        },
      },
    });

    const steps = await model.getRuntimeFlowSettingSteps('jsSettings');
    const optionsStep = Object.values(steps || {}).find((step) => step.title === 'Options');
    const settingsContext = { model } as FlowSettingsContext<JSBlockModel>;

    expect(() => optionsStep?.beforeParamsSave?.(settingsContext, { value: { limit: 'bad' } })).toThrow(
      'JS Template settings validation failed.',
    );
    expect(() => optionsStep?.beforeParamsSave?.(settingsContext, { value: { limit: 10, unknown: true } })).toThrow(
      'JS Template settings validation failed.',
    );
    expect(() => optionsStep?.beforeParamsSave?.(settingsContext, { value: { label: 'saved' } })).not.toThrow();
    expect(() => optionsStep?.beforeParamsSave?.(settingsContext, { value: null })).toThrow(
      'JS Template settings validation failed.',
    );
    expect(() => optionsStep?.beforeParamsSave?.(settingsContext, { value: { limit: 10 } })).not.toThrow();
  });

  it('keeps step identity stable when the schema changes for the same entry', async () => {
    let descriptor: RunJSSourceSettingsDescriptor = SETTINGS_DESCRIPTOR;
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'js-template',
      getSettingsDescriptor: vi.fn(async () => descriptor),
      resolve: () => ({
        code: 'ctx.render("sales");',
      }),
    });

    const engine = new FlowEngine();
    engine.registerModels({ JSBlockModel });
    const model = engine.createModel<JSBlockModel>({
      use: 'JSBlockModel',
      uid: 'js-block-runtime-settings-schema-change',
      stepParams: {
        jsSettings: {
          runJs: {
            sourceMode: 'js-template',
            sourceBinding: SOURCE_BINDING,
          },
        },
      },
    });

    const oldSteps = await model.getRuntimeFlowSettingSteps('jsSettings');
    descriptor = {
      ...SETTINGS_DESCRIPTOR,
      settingsSchemaHash: 'schema_next',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            title: 'Updated message',
          },
        },
      },
    };

    const nextSteps = await model.getRuntimeFlowSettingSteps('jsSettings');

    expect(Object.values(nextSteps || {}).map((step) => step.title)).toEqual(['Updated message']);
    expect(Object.keys(nextSteps || {})[0]).toBe(Object.keys(oldSteps || {})[0]);
  });

  it('passes runtime settings step values to the JS Template resolver', async () => {
    const resolve = vi.fn((input) => ({
      code: 'ctx.render(<span data-testid="settings-js-block">{ctx.settings.message}:{ctx.settings.pageSize}:{String(ctx.settings.enabled)}</span>);',
      version: 'v2',
      settings: input.settings,
    }));
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'js-template',
      getSettingsDescriptor: vi.fn(async () => SETTINGS_DESCRIPTOR),
      resolve,
    });

    const engine = new FlowEngine();
    engine.registerModels({ JSBlockModel });
    const model = engine.createModel<JSBlockModel>({
      use: 'JSBlockModel',
      uid: 'js-block-runtime-settings-values',
      stepParams: {
        jsSettings: {
          runJs: {
            sourceMode: 'js-template',
            sourceBinding: SOURCE_BINDING,
            settings: {
              message: 'Legacy',
              pageSize: 20,
              enabled: true,
            },
          },
        },
      },
    });
    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <FlowModelRenderer model={model} />
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('settings-js-block')).toHaveTextContent('Legacy:20:true');
    });
    expect(resolve).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: {
          message: 'Legacy',
          pageSize: 20,
          enabled: true,
        },
      }),
    );
    expect(Object.keys(model.getStepParams('jsSettings') || {})).toEqual(['runJs']);
  });

  it('resolves external source through the RunJS source registry', async () => {
    const resolve = vi.fn(() => ({
      code: 'ctx.render(<span data-testid="external-js-block">{ctx.settings.title}:{ctx.runJsSource.context.jsTemplate.templateId}</span>);',
      version: 'v2',
      settings: {
        title: 'Sales KPI',
      },
      context: {
        jsTemplate: {
          templateId: 'jtt_sales',
        },
      },
    }));
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'js-template',
      resolve,
    });

    renderJSBlock({
      sourceMode: 'js-template',
      sourceBinding: SOURCE_BINDING,
      settings: {
        title: 'Ignored before resolver normalization',
      },
      code: 'ctx.render(<span data-testid="inline-js-block">inline</span>);',
      version: 'v2',
    });

    await waitFor(() => {
      expect(screen.getByTestId('external-js-block')).toHaveTextContent('Sales KPI:jtt_sales');
    });
    expect(screen.queryByTestId('inline-js-block')).toBeNull();
    expect(resolve).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceMode: 'js-template',
        sourceBinding: SOURCE_BINDING,
      }),
    );
  });

  it('replaces an existing React root when the resolved source is refreshed', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    let code = 'ctx.render(<span data-testid="live-js-block">before</span>);';
    try {
      RunJSSourceResolverRegistry.registerResolver({
        sourceMode: 'js-template',
        resolve: () => ({ code, version: 'v2' }),
      });

      const model = renderJSBlock({
        sourceMode: 'js-template',
        sourceBinding: SOURCE_BINDING,
        version: 'v2',
      });

      expect(await screen.findByTestId('live-js-block')).toHaveTextContent('before');

      code = 'ctx.render(<span data-testid="live-js-block">after</span>);';
      model.invalidateFlowCache('beforeRender', true);
      await act(async () => {
        await model.rerender();
      });

      await waitFor(() => {
        expect(screen.getByTestId('live-js-block')).toHaveTextContent('after');
      });
      expect(consoleError.mock.calls.flat().join(' ')).not.toContain('already been passed to createRoot');
    } finally {
      consoleError.mockRestore();
    }
  });

  it('renders only a loading spinner while resolving an external source', async () => {
    let resolveSource: (source: { code: string; version: 'v2' }) => void = () => {
      throw new Error('Source resolver is not initialized');
    };
    const source = new Promise<{ code: string; version: 'v2' }>((resolve) => {
      resolveSource = resolve;
    });
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'js-template',
      resolve: () => source,
    });

    renderJSBlock({
      sourceMode: 'js-template',
      sourceBinding: SOURCE_BINDING,
      settings: {},
      version: 'v2',
    });

    const loading = await screen.findByTestId('js-block-runtime-loading');
    expect(loading.children).toHaveLength(1);

    resolveSource({
      code: 'ctx.render(<span data-testid="resolved-js-block">resolved</span>);',
      version: 'v2',
    });
    expect(await screen.findByTestId('resolved-js-block')).toHaveTextContent('resolved');
    expect(screen.queryByTestId('js-block-runtime-loading')).toBeNull();
  });

  it('renders resolver failures in the current block shell', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'js-template',
      resolve: async () => {
        throw {
          response: {
            status: 404,
            data: {
              errors: [
                {
                  code: 'JS_TEMPLATE_NOT_FOUND',
                  message: 'Entry missing',
                },
              ],
            },
          },
        };
      },
    });

    renderJSBlock({
      sourceMode: 'js-template',
      sourceBinding: SOURCE_BINDING,
      settings: {},
      version: 'v2',
    });

    await waitFor(() => {
      expect(screen.getByTestId('js-block-runtime-error')).toHaveTextContent('Entry missing');
    });
  });

  it('renders actionable inline settings diagnostics with invalid field paths', async () => {
    RunJSSettingsDescriptorProviderRegistry.registerProvider({
      key: 'inline-block-invalid-settings-test',
      canHandle: () => true,
      getSettingsDescriptor: async () => ({
        entryId: 'inline:repo-block:invalid-settings',
        settingsSchemaHash: 'schema-invalid',
        defaults: { pageSize: 5 },
        schema: {
          type: 'object',
          properties: {
            pageSize: { type: 'integer' },
          },
        },
      }),
    });

    renderJSBlock({
      code: 'ctx.render(String(ctx.settings.pageSize));',
      sourceMode: 'inline',
      sourceRef: { type: 'vsc-file', repoId: 'repo-block', commitId: 'commit-1' },
      settings: { pageSize: 'invalid' },
      version: 'v2',
    });

    const alert = await screen.findByTestId('js-block-runtime-error');
    expect(alert).toHaveTextContent('JS Template settings are invalid');
    expect(alert).toHaveTextContent('Open the block settings and fix the JS Template settings.');
    expect(alert).toHaveTextContent('Fields: pageSize');
  });

  it('runs pure inline code when the workspace has no entry.json settings descriptor', async () => {
    RunJSSettingsDescriptorProviderRegistry.registerProvider({
      key: 'inline-block-missing-entry-json-test',
      canHandle: (input) => input.sourceMode === 'inline' && Boolean(input.sourceRef),
      // Missing entry.json is optional: provider reports no settings schema.
      getSettingsDescriptor: async () => undefined,
    });

    renderJSBlock({
      code: 'ctx.render(<span data-testid="inline-no-settings">ok</span>);',
      sourceMode: 'inline',
      sourceRef: { type: 'vsc-file', repoId: 'repo-block', commitId: 'commit-1' },
      version: 'v2',
    });

    expect(await screen.findByTestId('inline-no-settings')).toHaveTextContent('ok');
    expect(screen.queryByTestId('js-block-runtime-error')).toBeNull();
  });
});
