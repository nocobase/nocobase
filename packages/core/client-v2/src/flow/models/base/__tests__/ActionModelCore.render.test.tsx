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
