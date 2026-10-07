/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { act, render, screen, waitFor } from '@nocobase/test/client';
import { App, ConfigProvider } from 'antd';
import { describe, expect, it } from 'vitest';
import { FlowEngine, FlowEngineProvider, FlowModelRenderer } from '@nocobase/flow-engine';
import { JSItemActionModel } from '../JSItemActionModel';

describe('JSItemActionModel', () => {
  it('keeps empty items reachable in configuration mode without replacing rendered content', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ JSItemActionModel });
    const model = engine.createModel<JSItemActionModel>({ use: 'JSItemActionModel' });
    await engine.flowSettings.disable();

    render(model.render());
    const host = model.context.ref.current;
    expect(host).toBeInstanceOf(HTMLDivElement);
    expect(host.style.minWidth).toBe('');
    expect(host.textContent).toBe('');

    await act(async () => {
      await engine.flowSettings.enable();
    });
    await waitFor(() => expect(host.style.minWidth).toBe('40px'));

    const content = document.createElement('button');
    content.textContent = 'Custom action';
    host.appendChild(content);

    await act(async () => {
      await engine.flowSettings.disable();
    });
    await waitFor(() => expect(host.style.minWidth).toBe(''));
    expect(model.context.ref.current).toBe(host);
    expect(host.firstElementChild).toBe(content);
  });

  it('keeps hidden empty items configurable and removes them outside configuration mode', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ JSItemActionModel });
    const model = engine.createModel<JSItemActionModel>({ use: 'JSItemActionModel' });
    model.setHidden(true);
    await engine.flowSettings.enable();

    const { container } = render(model.render());
    expect(model.context.ref.current.style.minWidth).toBe('40px');
    expect(model.context.ref.current.style.opacity).toBe('0.3');

    await act(async () => {
      await engine.flowSettings.disable();
    });
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it('renders collection-level custom content', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ JSItemActionModel });

    const model = engine.createModel<JSItemActionModel>({
      use: 'JSItemActionModel',
      uid: 'js-collection-item',
      stepParams: {
        jsSettings: {
          runJs: {
            version: 'v2',
            code: `ctx.render(<span data-testid="collection-js-item">collection item</span>);`,
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
      expect(screen.getByTestId('collection-js-item')).toHaveTextContent('collection item');
    });
  });

  it('renders record-level custom content with current row context', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ JSItemActionModel });

    const model = engine.createModel<JSItemActionModel>({
      use: 'JSItemActionModel',
      uid: 'js-record-item',
      stepParams: {
        jsSettings: {
          runJs: {
            version: 'v2',
            code: `ctx.render(<span data-testid="record-js-item">{ctx.record?.name}</span>);`,
          },
        },
      },
    });
    model.context.defineProperty('record', {
      get: () => ({ id: 1, name: 'row item' }),
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
      expect(screen.getByTestId('record-js-item')).toHaveTextContent('row item');
    });
  });
});
