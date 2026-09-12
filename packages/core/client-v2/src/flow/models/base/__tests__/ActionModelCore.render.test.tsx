/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen } from '@nocobase/test/client';
import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';
import { App, ConfigProvider } from 'antd';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { ActionModel } from '../ActionModel';

class NoIconActionModel extends ActionModel {
  defaultProps = {
    type: 'link' as const,
    title: 'Open details',
  };
}

describe('ActionModel rendering', () => {
  it('shows the title when iconOnly is true but no icon is configured', () => {
    const engine = new FlowEngine();
    engine.registerModels({ NoIconActionModel });
    const model = engine.createModel<NoIconActionModel>({
      use: 'NoIconActionModel',
      props: {
        title: 'Open details',
        iconOnly: true,
      },
    });

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>{model.render()}</App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    expect(screen.getByRole('button', { name: 'Open details' })).toBeInTheDocument();
  });
});

describe('ActionModel disabled state persistence', () => {
  it('drops disabled from persisted props during initialization', () => {
    const engine = new FlowEngine();
    engine.registerModels({ NoIconActionModel });
    const model = engine.createModel<NoIconActionModel>({
      use: 'NoIconActionModel',
      props: { title: 'Open details', disabled: true },
    });

    expect(model.getProps()).not.toHaveProperty('disabled');
  });

  it('keeps runtime disabled state without serializing it', () => {
    const engine = new FlowEngine();
    engine.registerModels({ NoIconActionModel });
    const model = engine.createModel<NoIconActionModel>({
      use: 'NoIconActionModel',
      props: { title: 'Open details' },
    });

    model.setProps('disabled', true);

    expect(model.getProps().disabled).toBe(true);
    expect(model.serialize().props).toEqual({ title: 'Open details' });
  });

  it('does not serialize fork-local disabled state', () => {
    const engine = new FlowEngine();
    engine.registerModels({ NoIconActionModel });
    const model = engine.createModel<NoIconActionModel>({
      use: 'NoIconActionModel',
      props: { title: 'Open details' },
    });
    const fork = model.createFork({ disabled: true });

    expect(fork.getProps().disabled).toBe(true);
    expect(fork.serialize().props).toEqual({ title: 'Open details' });
  });
});
