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
import { fireEvent, render, screen, waitFor } from '@nocobase/test/client';
import { FlowEngine, FlowEngineProvider, FlowModelRenderer, type FlowSettingsContext } from '@nocobase/flow-engine';
import { RunJSSourceResolverRegistry, type RunJSSourceSettingsDescriptor } from '../../../components/runjs-source';
import { JSItemActionModel } from '../JSItemActionModel';

const SOURCE_BINDING = {
  type: 'light-extension-entry',
  repoId: 'repo_items',
  entryId: 'entry_open_message',
  entryPath: 'src/client/js-items/open-message/index.tsx',
  kind: 'js-item',
  publicationId: 'pub_open_message',
  versionPolicy: 'pinned',
};

const SETTINGS_DESCRIPTOR: RunJSSourceSettingsDescriptor = {
  publicationId: 'pub_open_message',
  schemaHash: 'schema_open_message',
  defaults: {
    successMessage: 'Opened',
  },
  schema: {
    type: 'object',
    properties: {
      successMessage: {
        type: 'string',
        title: 'Success message',
      },
    },
  },
};

function createJSItemAction(stepParams: Record<string, unknown>) {
  const engine = new FlowEngine();
  engine.registerModels({ JSItemActionModel });
  const model = engine.createModel<JSItemActionModel>({
    use: 'JSItemActionModel',
    uid: `js-item-action-${Math.random()}`,
    stepParams: {
      jsSettings: {
        runJs: stepParams,
      },
    },
  });
  const message = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  };
  const reportRuntimeError = vi.fn();
  model.context.defineProperty('record', {
    value: {
      name: 'Ada',
      level: 'VIP',
    },
  });
  model.context.defineProperty('item', {
    value: {
      index: 1,
      value: {
        level: 'VIP',
      },
    },
  });
  model.context.defineProperty('message', {
    value: message,
  });
  model.context.defineProperty('reportRuntimeError', {
    value: reportRuntimeError,
  });
  return { engine, model, message, reportRuntimeError };
}

describe('JSItemActionModel light extension source', () => {
  afterEach(() => {
    RunJSSourceResolverRegistry.clear();
  });

  it('adds JS Item source mode, binding, and hidden RunJS source fields', () => {
    const { model } = createJSItemAction({});
    const flow = model.getFlow('jsSettings');
    const sourceModeStep = flow?.steps?.sourceMode;
    const sourceBindingStep = flow?.steps?.sourceBinding;
    const runJsStep = flow?.steps?.runJs;

    expect(sourceModeStep?.useRawParams).toBe(true);
    expect(sourceModeStep?.uiSchema?.sourceMode?.['x-component']).toBe('JSItemLightExtensionFullSourceField');
    expect(sourceModeStep?.uiSchema?.sourceBinding?.['x-display']).toBe('hidden');
    expect(sourceModeStep?.uiSchema?.settings?.['x-display']).toBe('hidden');
    expect(sourceBindingStep?.uiSchema?.sourceBinding?.['x-component']).toBe('JSItemLightExtensionFullSourceField');
    expect(runJsStep?.uiSchema?.sourceMode?.['x-display']).toBe('hidden');
    expect(runJsStep?.uiSchema?.sourceBinding?.['x-display']).toBe('hidden');
    expect(runJsStep?.uiSchema?.settings?.['x-display']).toBe('hidden');

    expect(sourceModeStep?.defaultParams?.(model.context as FlowSettingsContext<JSItemActionModel>)).toEqual({
      sourceMode: 'inline',
      sourceBinding: undefined,
      settings: {},
    });
    expect(() => sourceModeStep?.beforeParamsSave?.(model.context, { sourceMode: 'light-extension' }, {})).toThrow(
      'Light extension source binding is required.',
    );

    sourceModeStep?.beforeParamsSave?.(
      model.context as FlowSettingsContext<JSItemActionModel>,
      {
        sourceMode: 'light-extension',
        sourceBinding: SOURCE_BINDING,
        settings: {
          successMessage: 'Opened',
        },
      },
      {},
    );
    expect(model.getStepParams('jsSettings', 'runJs')).toMatchObject({
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
      settings: {
        successMessage: 'Opened',
      },
    });
  });

  it('generates runtime settings steps from the JS Item settings schema', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      getSettingsDescriptor: vi.fn(async () => SETTINGS_DESCRIPTOR),
      resolve: () => ({
        code: 'ctx.render("open");',
      }),
    });
    const { model } = createJSItemAction({
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
      settings: {
        successMessage: 'Opened',
      },
    });

    const steps = await model.getRuntimeFlowSettingSteps('jsSettings');
    const successMessageStep = Object.values(steps || {}).find((step) => step.title === 'Success message');
    successMessageStep?.beforeParamsSave?.(model.context as FlowSettingsContext<JSItemActionModel>, {
      value: 'Opened customer',
    });

    expect(successMessageStep?.uiSchema?.value?.['x-component']).toBe('JSItemLightExtensionSettingsStepField');
    expect(model.getStepParams('jsSettings', 'runJs')).toMatchObject({
      settings: {
        successMessage: 'Opened customer',
      },
    });
  });

  it('runs JS Item click logic through the runtime resolver and preserves sibling items', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: vi.fn(() => ({
        code: `
ctx.render(
  <button data-testid="open-message" onClick={() => ctx.message.success(ctx.settings.successMessage + ':' + ctx.record.name + ':' + ctx.item.index)}>
    {ctx.record.level}
  </button>
);
        `,
        version: 'v2',
        settings: {
          successMessage: 'Opened',
        },
        context: {
          lightExtension: {
            publicationId: 'pub_open_message',
          },
        },
      })),
    });
    const { engine, model, message } = createJSItemAction({
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
      settings: {
        successMessage: 'Ignored',
      },
    });

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <span data-testid="sibling-item">sibling</span>
            <FlowModelRenderer model={model} />
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('open-message')).toHaveTextContent('VIP');
    });
    fireEvent.click(screen.getByTestId('open-message'));

    expect(message.success).toHaveBeenCalledWith('Opened:Ada:1');
    expect(screen.getByTestId('sibling-item')).toHaveTextContent('sibling');
  });

  it('isolates click errors to the current JS Item and reports owner metadata', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: async () => ({
        code: `
function JsItem() {
  return (
    <button data-testid="broken-message" onClick={() => { throw new Error('click failed'); }}>
      Broken
    </button>
  );
}

ctx.render(
  <JsItem />
);
        `,
        version: 'v2',
        sourceMap: {
          entryPath: 'src/client/js-items/open-message/index.tsx',
        },
        context: {
          lightExtension: {
            publicationId: 'pub_open_message',
            entryPath: 'src/client/js-items/open-message/index.tsx',
          },
        },
      }),
    });
    const { engine, model, reportRuntimeError } = createJSItemAction({
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
      settings: {
        successMessage: 'Opened',
      },
    });

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <span data-testid="sibling-item">sibling</span>
            <FlowModelRenderer model={model} />
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('broken-message')).toHaveTextContent('Broken');
    });
    fireEvent.click(screen.getByTestId('broken-message'));

    await waitFor(() => {
      expect(screen.getByTestId('js-item-runtime-error')).toHaveTextContent('click failed');
    });
    expect(screen.getByTestId('sibling-item')).toHaveTextContent('sibling');
    await waitFor(() => {
      expect(reportRuntimeError).toHaveBeenCalledWith(
        expect.objectContaining({
          repoId: 'repo_items',
          entryId: 'entry_open_message',
          publicationId: 'pub_open_message',
          ownerKind: 'flowModel.itemSettings',
          path: 'src/client/js-items/open-message/index.tsx',
          ownerLocator: expect.objectContaining({
            kind: 'flowModel.itemSettings',
            modelUid: model.uid,
            use: 'JSItemActionModel',
          }),
          ownerLocatorHash: expect.stringMatching(/^(sha256|local):/),
        }),
      );
    });
  });

  it('reports resolver failures without rejecting neighboring menu items', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: async () => {
        throw Object.assign(new Error('publication missing'), {
          code: 'LIGHT_EXTENSION_PUBLICATION_NOT_FOUND',
          status: 404,
        });
      },
    });
    const { engine, model, reportRuntimeError } = createJSItemAction({
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
      settings: {
        successMessage: 'Opened',
      },
    });

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <span data-testid="sibling-item">sibling</span>
            <FlowModelRenderer model={model} />
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('js-item-runtime-error')).toHaveTextContent('publication missing');
    });
    expect(screen.getByTestId('sibling-item')).toHaveTextContent('sibling');
    await waitFor(() => {
      expect(reportRuntimeError).toHaveBeenCalledWith(
        expect.objectContaining({
          repoId: 'repo_items',
          entryId: 'entry_open_message',
          publicationId: 'pub_open_message',
          ownerKind: 'flowModel.itemSettings',
          path: 'src/client/js-items/open-message/index.tsx',
        }),
      );
    });
  });
});
