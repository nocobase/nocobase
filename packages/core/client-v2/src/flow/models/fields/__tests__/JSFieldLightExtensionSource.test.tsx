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
import { FlowEngine, FlowEngineProvider, FlowModelRenderer } from '@nocobase/flow-engine';
import { RunJSSourceResolverRegistry } from '../../../components/runjs-source';
import { JSFieldModel } from '../JSFieldModel';

const SOURCE_BINDING = {
  type: 'light-extension-entry',
  repoId: 'repo_fields',
  entryId: 'entry_phone',
  entryPath: 'src/client/js-fields/phone-link/index.tsx',
  kind: 'js-field',
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

  it('resolves JS Field entries and injects value, record, collectionField, settings, and source metadata', async () => {
    const resolve = vi.fn((input) => ({
      code: `
ctx.render(
  <span data-testid="phone-field">
    {ctx.settings.prefix}:{ctx.value}:{ctx.record.name}:{ctx.collectionField.name}:{ctx.runJsSource.context.lightExtension.entryId}
  </span>
);
      `,
      version: 'v2',
      settings: {
        prefix: 'tel:',
      },
      context: {
        lightExtension: {
          entryId: 'entry_phone',
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
      expect(screen.getByTestId('phone-field')).toHaveTextContent('tel::5551000:Ada:phone:entry_phone');
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

  it('renders JS Field resolver failures', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: async () => {
        throw Object.assign(new Error('entry missing'), {
          code: 'LIGHT_EXTENSION_ENTRY_NOT_FOUND',
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
      expect(screen.getByTestId('js-field-runtime-error')).toHaveTextContent('entry missing');
    });
  });

  it('renders JS Field runtime failures', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: async () => ({
        code: 'throw new Error("active entry failed");',
        version: 'v2',
        sourceMap: {
          entryPath: 'src/client/js-fields/phone-link/index.tsx',
        },
        context: {
          lightExtension: {
            entryId: 'entry_phone_active',
            entryPath: 'src/client/js-fields/phone-link/index.tsx',
          },
        },
      }),
    });
    const { engine, model } = createJSField({
      sourceMode: 'light-extension',
      sourceBinding: {
        ...SOURCE_BINDING,
      },
      settings: {
        prefix: 'tel:',
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
      expect(screen.getByTestId('js-field-runtime-error')).toHaveTextContent('active entry failed');
    });
  });
});
