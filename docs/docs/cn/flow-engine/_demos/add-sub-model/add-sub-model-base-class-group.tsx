import { Application, Plugin, BlockModel } from '@nocobase/client-v2';
import { AddSubModelButton, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Space } from 'antd';

class HelloBlockModel extends FlowModel {
  render() {
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        {this.mapSubModels('items', (item) => {
          return <FlowModelRenderer key={item.uid} model={item} showFlowSettings={{ showBorder: true }} />;
        })}
        <AddSubModelButton
          model={this}
          subModelKey="items"
          subModelBaseClasses={['BaseBlockModel', 'BlockModel']}
        >
          <Button>Add block</Button>
        </AddSubModelButton>
      </Space>
    );
  }
}

class Sub1BlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h2>Sub1 Block</h2>
        <p>This is a sub block rendered by Sub1BlockModel.</p>
      </div>
    );
  }
}

class BaseBlockModel extends BlockModel {}

BaseBlockModel.define({
  label: 'Group1',
});

class Sub2BlockModel extends BaseBlockModel {
  renderComponent() {
    return (
      <div>
        <h2>Sub2 Block</h2>
        <p>This is a sub block rendered by Sub2BlockModel.</p>
      </div>
    );
  }
}

class Sub3BlockModel extends BaseBlockModel {
  renderComponent() {
    return (
      <div>
        <h2>Sub3 Block</h2>
        <p>This is a sub block rendered by Sub2BlockModel.</p>
      </div>
    );
  }
}

Sub2BlockModel.define({
  label: 'Sub2 Block',
});

class PluginHelloModel extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({
      BlockModel,
      HelloBlockModel,
      BaseBlockModel,
      Sub1BlockModel,
      Sub2BlockModel,
      Sub3BlockModel,
    });
    const model = this.flowEngine.createModel({
      uid: 'my-model',
      use: 'HelloBlockModel',
    });
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
