import { Application, BlockModel, Plugin } from '@nocobase/client';
import { AddSubModelButton, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Space } from 'antd';
import React from 'react';

class DemoContainerModel extends FlowModel {
  render() {
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        {this.mapSubModels('items', (item) => (
          <FlowModelRenderer key={item.uid} model={item} showFlowSettings={{ showBorder: true }} />
        ))}

        <AddSubModelButton
          model={this}
          subModelKey="items"
          items={[
            {
              key: 'submenu',
              label: 'Pick a block',
              searchable: true,
              searchPlaceholder: 'Search blocks',
              children: [
                { key: 'a', label: 'Block 1', useModel: 'BlockAModel' },
                { key: 'b', label: 'Block 2', useModel: 'BlockBModel' },
                {
                  key: 'g',
                  type: 'group',
                  label: 'Group X',
                  children: [{ key: 'x', label: 'Xray', useModel: 'BlockBModel' }],
                },
              ],
            },
          ]}
        >
          <Button>Add block (submenu search)</Button>
        </AddSubModelButton>
      </Space>
    );
  }
}

class BlockAModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h3>Block 1</h3>
      </div>
    );
  }
}

class BlockBModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h3>Block 2</h3>
      </div>
    );
  }
}

class DemoPlugin extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ DemoContainerModel, BlockAModel, BlockBModel });
    const model = this.flowEngine.createModel({ uid: 'demo', use: 'DemoContainerModel' });
    this.router.add('root', { path: '/', element: <FlowModelRenderer model={model} /> });
  }
}

const app = new Application({ router: { type: 'memory', initialEntries: ['/'] }, plugins: [DemoPlugin] });
export default app.getRootComponent();
