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
import { FlowEngine, FlowEngineProvider, FlowModelRenderer } from '@nocobase/flow-engine';
import { RunJSSourceResolverRegistry } from '../../../components/runjs-source';
import { JSItemActionModel } from '../JSItemActionModel';

const SOURCE_BINDING = {
  type: 'js-template-entry',
  projectId: 'jtp_items',
  templateId: 'jtt_open_message',
  kind: 'js-item',
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
  return { engine, model, message };
}

describe('JSItemActionModel JS Template source', () => {
  afterEach(() => {
    RunJSSourceResolverRegistry.clear();
  });

  it('runs JS Item click logic through the runtime resolver and preserves sibling items', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'js-template',
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
          jsTemplate: {
            templateId: 'jtt_open_message',
          },
        },
      })),
    });
    const { engine, model, message } = createJSItemAction({
      sourceMode: 'js-template',
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

  it('isolates click errors to the current JS Item', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'js-template',
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
          jsTemplate: {
            templateId: 'jtt_open_message',
            entryPath: 'src/client/js-items/open-message/index.tsx',
          },
        },
      }),
    });
    const { engine, model } = createJSItemAction({
      sourceMode: 'js-template',
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
  });

  it('renders resolver failures without rejecting neighboring menu items', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'js-template',
      resolve: async () => {
        throw Object.assign(new Error('entry missing'), {
          code: 'JS_TEMPLATE_NOT_FOUND',
          status: 404,
        });
      },
    });
    const { engine, model } = createJSItemAction({
      sourceMode: 'js-template',
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
      expect(screen.getByTestId('js-item-runtime-error')).toHaveTextContent('entry missing');
    });
    expect(screen.getByTestId('sibling-item')).toHaveTextContent('sibling');
  });
});
