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
import { render, screen, waitFor } from '@nocobase/test/client';
import {
  FlowEngine,
  FlowEngineProvider,
  FlowModelRenderer,
  FlowRuntimeContext,
  type FlowSettingsContext,
} from '@nocobase/flow-engine';
import { RunJSSourceResolverRegistry, type RunJSSourceSettingsDescriptor } from '../../../../components/runjs-source';
import { PluginFlowEngine } from '../../../../index';
import { createMockClient } from '../../../../../MockApplication';
import { JSBlockModel } from '../JSBlock';
import { JSBlockSourceModeField } from '../JSBlockSourceModeField';

const SOURCE_BINDING = {
  type: 'light-extension-entry',
  repoId: 'repo_sales',
  entryId: 'entry_sales',
  kind: 'js-block',
  publicationId: 'pub_sales',
  versionPolicy: 'pinned',
};

const SETTINGS_DESCRIPTOR = {
  publicationId: 'pub_active',
  schemaHash: 'schema_active',
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

describe('JSBlockModel light extension source', () => {
  afterEach(() => {
    RunJSSourceResolverRegistry.clear();
  });

  it('registers a core fallback source field when the light extension plugin is not loaded', async () => {
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

    expect(app.flowEngine.flowSettings.components.JSBlockLightExtensionSourceField).toBe(JSBlockSourceModeField);
  });

  it('moves code source selection to the block settings menu', async () => {
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
          options?: Array<{ label: string; value: string }>;
        };
      };
      defaultParams?: (ctx: typeof model.context) => Record<string, unknown> | Promise<Record<string, unknown>>;
      beforeParamsSave?: (ctx: typeof model.context, params: Record<string, unknown>, previousParams: unknown) => void;
      afterParamsSave?: (ctx: typeof model.context, params: Record<string, unknown>, previousParams: unknown) => void;
    };

    expect(sourceModeStep?.title).toBe('{{t("Code source")}}');
    expect(sourceModeStep?.uiMode).toMatchObject({
      type: 'select',
      key: 'sourceMode',
      props: {
        options: [
          { label: 'Light extension', value: 'light-extension' },
          { label: 'Inline Code', value: 'inline' },
        ],
      },
    });
    expect(await sourceModeStep.defaultParams?.(model.context)).toEqual({ sourceMode: 'inline' });
    expect(runJsStep?.uiSchema?.sourceMode?.['x-display']).toBe('hidden');
    expect(runJsStep?.uiSchema?.sourceMode?.['x-component']).toBeUndefined();
    expect(runJsStep?.uiSchema?.sourceBinding?.['x-display']).toBe('hidden');
    expect(runJsStep?.uiSchema?.settings?.['x-display']).toBe('hidden');
    expect(runJsStep?.uiSchema?.settings?.['x-visible']).toBeUndefined();
    expect(runJsStep?.uiSchema?.code?.['x-component']).toBeTypeOf('function');
    expect(runJsStep?.uiSchema?.code?.['x-reactions']).toBeUndefined();
    const runJsUiMode = await runJsStep?.uiMode?.(new FlowRuntimeContext(model, 'jsSettings', 'settings'));
    expect(runJsUiMode?.props?.footer).toBeNull();
    expect(model.getFlow('jsSettings')?.steps?.lightExtensionSource).toBeUndefined();
  });

  it('includes the selected light extension name in the RunJS drawer title', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ JSBlockModel });
    const model = engine.createModel<JSBlockModel>({
      use: 'JSBlockModel',
      uid: 'js-block-runjs-title',
      stepParams: {
        jsSettings: {
          runJs: {
            sourceMode: 'light-extension',
            sourceBinding: {
              ...SOURCE_BINDING,
              entryTitle: 'Sales KPI',
            },
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
    expect(uiMode?.props?.title).toBe('Write JavaScript (Light extension: Sales KPI)');
  });

  it('resolves legacy light extension names through the RunJS source resolver', async () => {
    const getBindingTitle = vi.fn(async () => 'Sales KPI');
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
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
            sourceMode: 'light-extension',
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

    expect(uiMode?.props?.title).toBe('Write JavaScript (Light extension: Sales KPI)');
    expect(getBindingTitle).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceMode: 'light-extension',
        sourceBinding: SOURCE_BINDING,
      }),
    );
  });

  it('syncs menu code source changes into the RunJS step and refreshes rendering', async () => {
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

    sourceModeStep.beforeParamsSave?.(model.context, { sourceMode: 'light-extension' }, {});

    expect(model.getStepParams('jsSettings', 'runJs')).toMatchObject({
      sourceMode: 'light-extension',
      code: 'ctx.render("inline");',
      version: 'v2',
    });

    await sourceModeStep.afterParamsSave?.(model.context, { sourceMode: 'light-extension' }, {});

    expect(invalidateSpy).toHaveBeenCalledWith('beforeRender', true);
    expect(rerenderSpy).toHaveBeenCalled();
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

  it('generates runtime settings steps from the light extension active settings schema', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      getSettingsDescriptor: vi.fn(async () => SETTINGS_DESCRIPTOR),
      resolve: () => ({
        code: 'ctx.render("sales");',
      }),
    });

    const engine = new FlowEngine();
    engine.registerModels({ JSBlockModel });
    const model = engine.createModel<JSBlockModel>({
      use: 'JSBlockModel',
      uid: 'js-block-runtime-settings-steps',
      stepParams: {
        jsSettings: {
          runJs: {
            sourceMode: 'light-extension',
            sourceBinding: SOURCE_BINDING,
          },
        },
      },
    });

    const steps = await model.getRuntimeFlowSettingSteps('jsSettings');

    expect(Object.values(steps || {}).map((step) => step.title)).toEqual(['Message', 'Page size', 'Enabled']);
    expect(Object.keys(steps || {})).toHaveLength(3);
    expect(Object.keys(steps || {}).every((key) => key.startsWith('leSetting__'))).toBe(true);
    expect(Object.values(steps || {})[0]?.uiSchema?.value?.['x-component']).toBe(
      'JSBlockLightExtensionSettingsStepField',
    );
  });

  it('validates nested object settings before saving a runtime settings step', async () => {
    const descriptor: RunJSSourceSettingsDescriptor = {
      publicationId: 'pub_object_settings',
      schemaHash: 'schema_object_settings',
      defaults: {},
      schema: {
        type: 'object',
        properties: {
          options: {
            type: 'object',
            title: 'Options',
            required: ['limit'],
            properties: {
              limit: {
                type: 'integer',
                title: 'Limit',
              },
            },
          },
        },
      },
    };

    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
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
            sourceMode: 'light-extension',
            sourceBinding: SOURCE_BINDING,
          },
        },
      },
    });

    const steps = await model.getRuntimeFlowSettingSteps('jsSettings');
    const optionsStep = Object.values(steps || {}).find((step) => step.title === 'Options');
    const settingsContext = { model } as FlowSettingsContext<JSBlockModel>;

    expect(() => optionsStep?.beforeParamsSave?.(settingsContext, { value: { limit: 'bad' } })).toThrow(
      'Light extension settings validation failed.',
    );
    expect(() => optionsStep?.beforeParamsSave?.(settingsContext, { value: { limit: 10 } })).not.toThrow();
  });

  it('uses the active schema hash when regenerating runtime settings steps', async () => {
    let descriptor: RunJSSourceSettingsDescriptor = SETTINGS_DESCRIPTOR;
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
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
            sourceMode: 'light-extension',
            sourceBinding: SOURCE_BINDING,
          },
        },
      },
    });

    const oldSteps = await model.getRuntimeFlowSettingSteps('jsSettings');
    descriptor = {
      ...SETTINGS_DESCRIPTOR,
      schemaHash: 'schema_next',
      schema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            title: 'Title',
          },
        },
      },
    };

    const nextSteps = await model.getRuntimeFlowSettingSteps('jsSettings');

    expect(Object.values(nextSteps || {}).map((step) => step.title)).toEqual(['Title']);
    expect(Object.keys(nextSteps || {})).not.toEqual(Object.keys(oldSteps || {}));
  });

  it('passes runtime settings step values to the light extension resolver', async () => {
    const resolve = vi.fn((input) => ({
      code: 'ctx.render(<span data-testid="settings-js-block">{ctx.settings.message}:{ctx.settings.pageSize}:{String(ctx.settings.enabled)}</span>);',
      version: 'v2',
      settings: input.settings,
    }));
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
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
            sourceMode: 'light-extension',
            sourceBinding: SOURCE_BINDING,
            settings: {
              message: 'Legacy',
            },
          },
        },
      },
    });
    const steps = await model.getRuntimeFlowSettingSteps('jsSettings');
    const pageSizeStepKey = Object.entries(steps || {}).find(([, step]) => step.title === 'Page size')?.[0];
    expect(pageSizeStepKey).toBeTruthy();
    model.setStepParams('jsSettings', pageSizeStepKey as string, { value: 20 });

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
  });

  it('resolves external source through the RunJS source registry', async () => {
    const resolve = vi.fn(() => ({
      code: 'ctx.render(<span data-testid="external-js-block">{ctx.settings.title}:{ctx.runJsSource.context.lightExtension.publicationId}</span>);',
      version: 'v2',
      settings: {
        title: 'Sales KPI',
      },
      context: {
        lightExtension: {
          publicationId: 'pub_sales',
        },
      },
    }));
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve,
    });

    renderJSBlock({
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
      settings: {
        title: 'Ignored before resolver normalization',
      },
      code: 'ctx.render(<span data-testid="inline-js-block">inline</span>);',
      version: 'v2',
    });

    await waitFor(() => {
      expect(screen.getByTestId('external-js-block')).toHaveTextContent('Sales KPI:pub_sales');
    });
    expect(screen.queryByTestId('inline-js-block')).toBeNull();
    expect(resolve).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceMode: 'light-extension',
        sourceBinding: SOURCE_BINDING,
      }),
    );
  });

  it('renders resolver failures in the current block shell', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: async () => {
        throw {
          response: {
            status: 404,
            data: {
              errors: [
                {
                  code: 'LIGHT_EXTENSION_PUBLICATION_NOT_FOUND',
                  message: 'Publication missing',
                },
              ],
            },
          },
        };
      },
    });

    renderJSBlock({
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
      settings: {},
      version: 'v2',
    });

    await waitFor(() => {
      expect(screen.getByTestId('js-block-runtime-error')).toHaveTextContent('Publication missing');
    });
  });

  it.each([
    [
      'LIGHT_EXTENSION_BINDING_OUTDATED',
      409,
      'Light extension binding is outdated',
      'Refresh the block settings and choose the current active publication.',
    ],
    [
      'LIGHT_EXTENSION_SETTINGS_INVALID',
      422,
      'Light extension settings are invalid',
      'Open the block settings and fix the light extension settings.',
    ],
    [
      'LIGHT_EXTENSION_PUBLICATION_NOT_FOUND',
      404,
      'Light extension publication missing',
      'Choose an available publication or publish this entry again.',
    ],
    [
      'LIGHT_EXTENSION_FORBIDDEN',
      403,
      'Light extension access denied',
      'Ask an administrator for permission to use this light extension publication.',
    ],
    [
      'LIGHT_EXTENSION_REPO_ARCHIVED',
      409,
      'Light extension repository is archived',
      'Restore the repository or choose a publication from another repository.',
    ],
  ])('renders an actionable hint for %s errors', async (code, status, title, hint) => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: async () => {
        throw {
          response: {
            status,
            data: {
              errors: [
                {
                  code,
                  message: code,
                },
              ],
            },
          },
        };
      },
    });

    renderJSBlock({
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
      settings: {},
      version: 'v2',
    });

    await waitFor(() => {
      expect(screen.getByTestId('js-block-runtime-error')).toHaveTextContent(title);
      expect(screen.getByTestId('js-block-runtime-error')).toHaveTextContent(hint);
    });
  });

  it.each([
    [403, 'Light extension access denied'],
    [404, 'Light extension publication missing'],
  ])('renders status-only %s resolver failures with light-extension hints', async (status, title) => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: async () => {
        throw {
          response: {
            status,
            data: {
              errors: [
                {
                  message: 'Request failed',
                },
              ],
            },
          },
        };
      },
    });

    renderJSBlock({
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
      settings: {},
      version: 'v2',
    });

    await waitFor(() => {
      expect(screen.getByTestId('js-block-runtime-error')).toHaveTextContent(title);
      expect(screen.getByTestId('js-block-runtime-error')).toHaveTextContent('Request failed');
    });
  });
});
