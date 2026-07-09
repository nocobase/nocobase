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
  type FlowSettingsContext,
} from '@nocobase/flow-engine';
import { RunJSSourceResolverRegistry, type RunJSSourceSettingsDescriptor } from '../../../components/runjs-source';
import { JSFieldModel } from '../JSFieldModel';

const SOURCE_BINDING = {
  type: 'light-extension-entry',
  repoId: 'repo_fields',
  entryId: 'entry_phone',
  entryPath: 'src/client/js-fields/phone-link/index.tsx',
  kind: 'js-field',
  publicationId: 'pub_phone',
  versionPolicy: 'pinned',
};

const SETTINGS_DESCRIPTOR: RunJSSourceSettingsDescriptor = {
  publicationId: 'pub_phone',
  schemaHash: 'schema_phone',
  defaults: {
    prefix: 'tel:',
  },
  schema: {
    type: 'object',
    properties: {
      prefix: {
        type: 'string',
        title: 'Prefix',
      },
    },
  },
};

function createJSField(stepParams: Record<string, unknown>) {
  const engine = new FlowEngine();
  engine.registerModels({ JSFieldModel });
  const model = engine.createModel<JSFieldModel>({
    use: 'JSFieldModel',
    uid: `js-field-${Math.random()}`,
    props: {
      value: '5551000',
    },
    stepParams: {
      jsSettings: {
        runJs: stepParams,
      },
    },
  });
  model.context.defineProperty('record', {
    value: {
      name: 'Ada',
    },
  });
  model.context.defineProperty('collectionField', {
    value: {
      name: 'phone',
    },
  });
  return { engine, model };
}

describe('JSFieldModel light extension source', () => {
  afterEach(() => {
    RunJSSourceResolverRegistry.clear();
  });

  it('adds JS Field source mode and hidden RunJS source binding fields', async () => {
    const { model } = createJSField({});
    const flow = model.getFlow('jsSettings');
    const runJsStep = flow?.steps?.runJs as {
      uiSchema?: Record<string, Record<string, unknown>>;
      uiMode?: (
        ctx: FlowRuntimeContext<JSFieldModel>,
      ) =>
        | { props?: { footer?: unknown; title?: unknown } }
        | Promise<{ props?: { footer?: unknown; title?: unknown } }>;
    };
    const sourceModeStep = flow?.steps?.sourceMode as {
      uiMode?: { props?: { loadItems?: (input: unknown) => Promise<unknown> } };
      useRawParams?: boolean;
      uiSchema?: Record<string, Record<string, unknown>>;
      defaultParams?: (ctx: FlowSettingsContext<JSFieldModel>) => Record<string, unknown>;
      beforeParamsSave?: (ctx: typeof model.context, params: Record<string, unknown>, previousParams: unknown) => void;
    };
    const sourceBindingStep = flow?.steps?.sourceBinding as {
      hideInSettings?: boolean;
      uiSchema?: Record<string, Record<string, unknown>>;
    };

    expect(sourceModeStep?.useRawParams).toBe(true);
    const listSourceMenuItems = vi.fn(async () => []);
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: () => ({
        code: '',
      }),
      listSourceMenuItems,
    });
    await sourceModeStep?.uiMode?.props?.loadItems?.({
      params: {
        sourceMode: 'inline',
      },
      defaultParams: {},
      t: (key: string) => key,
    });
    expect(listSourceMenuItems).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'js-field',
        defaultVersionPolicy: 'follow-active',
      }),
    );
    expect(sourceModeStep?.uiSchema?.sourceMode?.['x-component']).toBe('JSFieldLightExtensionFullSourceField');
    expect(sourceModeStep?.uiSchema?.sourceMode?.['x-component-props']).toMatchObject({
      kind: 'js-field',
      defaultVersionPolicy: 'follow-active',
    });
    expect(sourceModeStep?.uiSchema?.sourceBinding?.['x-display']).toBe('hidden');
    expect(sourceModeStep?.uiSchema?.settings?.['x-display']).toBe('hidden');
    expect(sourceBindingStep?.hideInSettings).toBe(true);
    expect(sourceBindingStep?.uiSchema?.sourceBinding?.['x-component']).toBe('JSFieldLightExtensionFullSourceField');
    expect(sourceBindingStep?.uiSchema?.sourceBinding?.['x-component-props']).toMatchObject({
      kind: 'js-field',
      defaultVersionPolicy: 'follow-active',
    });
    expect(runJsStep?.uiSchema?.sourceMode?.['x-display']).toBe('hidden');
    expect(runJsStep?.uiSchema?.sourceBinding?.['x-display']).toBe('hidden');
    expect(runJsStep?.uiSchema?.settings?.['x-display']).toBe('hidden');
    const runJsUiMode = await runJsStep?.uiMode?.(new FlowRuntimeContext(model, 'jsSettings', 'settings'));
    expect(runJsUiMode?.props?.footer).toBeNull();

    expect(sourceModeStep.defaultParams?.(model.context as FlowSettingsContext<JSFieldModel>)).toEqual({
      sourceMode: 'inline',
      sourceBinding: undefined,
      settings: {},
    });
    expect(() => sourceModeStep.beforeParamsSave?.(model.context, { sourceMode: 'light-extension' }, {})).toThrow(
      'Light extension source binding is required.',
    );

    sourceModeStep.beforeParamsSave?.(
      model.context,
      {
        sourceMode: 'light-extension',
        sourceBinding: SOURCE_BINDING,
        settings: {
          prefix: 'tel:',
        },
      },
      {},
    );
    expect(model.getStepParams('jsSettings', 'runJs')).toMatchObject({
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
      settings: {
        prefix: 'tel:',
      },
    });
  });

  it('copies selected source binding and settings into the RunJS step', () => {
    const { model } = createJSField({
      sourceMode: 'inline',
      code: 'ctx.render("inline");',
      version: 'v2',
    });
    const sourceBindingStep = model.getFlow('jsSettings')?.steps?.sourceBinding as {
      beforeParamsSave?: (ctx: FlowSettingsContext<JSFieldModel>, params: Record<string, unknown>) => void;
    };

    model.setStepParams('jsSettings', 'sourceBinding', {
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
      settings: {
        prefix: 'callto:',
      },
    });
    sourceBindingStep.beforeParamsSave?.(model.context as FlowSettingsContext<JSFieldModel>, {
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
      settings: {
        prefix: 'callto:',
      },
    });

    expect(model.getStepParams('jsSettings', 'runJs')).toMatchObject({
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
      settings: {
        prefix: 'callto:',
      },
      code: 'ctx.render("inline");',
      version: 'v2',
    });
    expect(model.getStepParams('jsSettings', 'sourceBinding')).toEqual(SOURCE_BINDING);
    expect(model.getStepParams('jsSettings', 'settings')).toEqual({
      prefix: 'callto:',
    });
  });

  it('generates runtime settings steps from the JS Field settings schema', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      getSettingsDescriptor: vi.fn(async () => SETTINGS_DESCRIPTOR),
      resolve: () => ({
        code: 'ctx.render("phone");',
      }),
    });
    const { model } = createJSField({
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
    });

    const steps = await model.getRuntimeFlowSettingSteps('jsSettings');

    expect(Object.values(steps || {}).map((step) => step.title)).toEqual(['Prefix']);
    expect(Object.values(steps || {})[0]?.uiSchema?.value?.['x-component']).toBe(
      'JSFieldLightExtensionSettingsStepField',
    );
  });

  it('persists runtime settings step values back to RunJS settings', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      getSettingsDescriptor: vi.fn(async () => SETTINGS_DESCRIPTOR),
      resolve: () => ({
        code: 'ctx.render("phone");',
      }),
    });
    const { model } = createJSField({
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
      settings: {
        prefix: 'tel:',
      },
    });

    const steps = await model.getRuntimeFlowSettingSteps('jsSettings');
    const prefixStep = Object.values(steps || {}).find((step) => step.title === 'Prefix');
    prefixStep?.beforeParamsSave?.(model.context as FlowSettingsContext<JSFieldModel>, { value: 'callto:' });

    expect(model.getStepParams('jsSettings', 'runJs')).toMatchObject({
      settings: {
        prefix: 'callto:',
      },
    });
    expect(model.getStepParams('jsSettings', 'settings')).toEqual({
      prefix: 'callto:',
    });
  });

  it('does not fetch settings descriptors before resolving the runtime source', async () => {
    const getSettingsDescriptor = vi.fn(async () => {
      throw new Error('settings descriptor should not be loaded during render');
    });
    const resolve = vi.fn((input) => ({
      code: `
ctx.render(
  <span data-testid="active-plan">
    {ctx.settings.activePlan}
  </span>
);
      `,
      version: 'v2',
      settings: {
        activePlan: 'active-default',
      },
    }));
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      getSettingsDescriptor,
      resolve,
    });
    const { engine, model } = createJSField({
      sourceMode: 'light-extension',
      sourceBinding: {
        ...SOURCE_BINDING,
        publicationId: 'pub_phone_legacy',
        versionPolicy: 'follow-active',
      },
      settings: {
        legacyPlan: 'legacy-value',
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
      expect(screen.getByTestId('active-plan')).toHaveTextContent('active-default');
    });
    expect(getSettingsDescriptor).not.toHaveBeenCalled();
    expect(resolve).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: {
          legacyPlan: 'legacy-value',
        },
      }),
    );
  });

  it('resolves JS Field publications and injects value, record, collectionField, settings, and source metadata', async () => {
    const resolve = vi.fn((input) => ({
      code: `
ctx.render(
  <span data-testid="phone-field">
    {ctx.settings.prefix}:{ctx.value}:{ctx.record.name}:{ctx.collectionField.name}:{ctx.runJsSource.context.lightExtension.publicationId}
  </span>
);
      `,
      version: 'v2',
      settings: {
        prefix: 'tel:',
      },
      context: {
        lightExtension: {
          publicationId: 'pub_phone',
        },
      },
    }));
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve,
    });
    const { engine, model } = createJSField({
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
      settings: {
        prefix: 'ignored-before-resolver',
      },
      code: 'ctx.render(<span data-testid="inline-field">inline</span>);',
      version: 'v2',
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
      expect(screen.getByTestId('phone-field')).toHaveTextContent('tel::5551000:Ada:phone:pub_phone');
    });
    expect(screen.queryByTestId('inline-field')).toBeNull();
    expect(resolve).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceMode: 'light-extension',
        sourceBinding: SOURCE_BINDING,
      }),
    );
  });

  it('ignores stale async JS Field resolution results after a newer run starts', async () => {
    const pending: Array<{
      resolve: (value: { code: string; version: string }) => void;
    }> = [];
    const resolve = vi.fn(
      () =>
        new Promise<{ code: string; version: string }>((resolve) => {
          pending.push({ resolve });
        }),
    );
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve,
    });
    const { engine, model } = createJSField({
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
      code: 'ctx.render("inline");',
      version: 'v2',
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
      expect(resolve).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      model.setProps({
        value: '5552000',
      });
    });
    await waitFor(() => {
      expect(resolve).toHaveBeenCalledTimes(2);
    });

    await act(async () => {
      pending[1].resolve({
        code: 'ctx.render(<span data-testid="phone-field">new:{ctx.value}</span>);',
        version: 'v2',
      });
    });
    await waitFor(() => {
      expect(screen.getByTestId('phone-field')).toHaveTextContent('new:5552000');
    });

    await act(async () => {
      pending[0].resolve({
        code: 'ctx.render(<span data-testid="phone-field">old:{ctx.value}</span>);',
        version: 'v2',
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByTestId('phone-field')).toHaveTextContent('new:5552000');
  });

  it('reruns when the record changes but the field value stays the same', async () => {
    let currentRecord = {
      name: 'Ada',
    };
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: () => ({
        code: `
ctx.render(
  <span data-testid="phone-field">
    {ctx.record.name}:{ctx.value}
  </span>
);
        `,
        version: 'v2',
      }),
    });
    const { engine, model } = createJSField({
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
      code: 'ctx.render("inline");',
      version: 'v2',
    });
    model.context.defineProperty('record', {
      get: () => currentRecord,
      cache: false,
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
      expect(screen.getByTestId('phone-field')).toHaveTextContent('Ada:5551000');
    });

    currentRecord = {
      name: 'Grace',
    };
    await act(async () => {
      model.setProps({
        value: '5551000',
        recordVersion: 'grace',
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('phone-field')).toHaveTextContent('Grace:5551000');
    });
  });

  it('reports resolve failures with JS Field binding and owner locator metadata', async () => {
    const reportRuntimeError = vi.fn();
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: async () => {
        throw Object.assign(new Error('publication missing'), {
          code: 'LIGHT_EXTENSION_PUBLICATION_NOT_FOUND',
          status: 404,
        });
      },
    });
    const { engine, model } = createJSField({
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
      settings: {
        prefix: 'tel:',
      },
      code: 'ctx.render(<span data-testid="inline-field">inline</span>);',
      version: 'v2',
    });
    model.context.defineProperty('reportRuntimeError', {
      value: reportRuntimeError,
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
      expect(screen.getByTestId('js-field-runtime-error')).toHaveTextContent('publication missing');
    });
    await waitFor(() => {
      expect(reportRuntimeError).toHaveBeenCalledWith(
        expect.objectContaining({
          repoId: 'repo_fields',
          entryId: 'entry_phone',
          publicationId: 'pub_phone',
          ownerKind: 'flowModel.fieldSettings',
          path: 'src/client/js-fields/phone-link/index.tsx',
          ownerLocator: expect.objectContaining({
            kind: 'flowModel.fieldSettings',
            modelUid: model.uid,
            use: 'JSFieldModel',
          }),
          ownerLocatorHash: expect.stringMatching(/^(sha256|local):/),
        }),
      );
    });
  });

  it('reports runtime failures with the resolved follow-active publication id', async () => {
    const reportRuntimeError = vi.fn();
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: async () => ({
        code: 'throw new Error("active publication failed");',
        version: 'v2',
        sourceMap: {
          entryPath: 'src/client/js-fields/phone-link/index.tsx',
        },
        context: {
          lightExtension: {
            publicationId: 'pub_phone_active',
            entryPath: 'src/client/js-fields/phone-link/index.tsx',
          },
        },
      }),
    });
    const { engine, model } = createJSField({
      sourceMode: 'light-extension',
      sourceBinding: {
        ...SOURCE_BINDING,
        publicationId: 'pub_phone_legacy',
        versionPolicy: 'follow-active',
      },
      settings: {
        prefix: 'tel:',
      },
      code: 'ctx.render(<span data-testid="inline-field">inline</span>);',
      version: 'v2',
    });
    model.context.defineProperty('reportRuntimeError', {
      value: reportRuntimeError,
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
      expect(screen.getByTestId('js-field-runtime-error')).toHaveTextContent('active publication failed');
    });
    await waitFor(() => {
      expect(reportRuntimeError).toHaveBeenCalledWith(
        expect.objectContaining({
          repoId: 'repo_fields',
          entryId: 'entry_phone',
          publicationId: 'pub_phone_active',
          ownerKind: 'flowModel.fieldSettings',
          path: 'src/client/js-fields/phone-link/index.tsx',
        }),
      );
    });
  });
});
