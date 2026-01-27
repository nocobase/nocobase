import { Application, BlockModel, Plugin } from '@nocobase/client';
import { AddSubModelButton, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Space } from 'antd';
import React from 'react';

class HelloBlockModel extends FlowModel {
  render() {
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        {this.mapSubModels('items', (item) => {
          return <FlowModelRenderer key={item.uid} model={item} showFlowSettings={{ showBorder: true }} />;
        })}
        <AddSubModelButton
          model={this}
          subModelKey={'items'}
          items={[
            {
              key: 'sub1',
              label: 'Sub1 Block',
              useModel: 'Sub1BlockModel',
            },
            {
              key: 'sub2',
              label: 'Sub2 Block',
              children: [
                {
                  key: 'sub2-1',
                  label: 'Sub2-1 Block',
                  useModel: 'Sub2BlockModel',
                },
                {
                  key: 'sub2-2',
                  label: 'Sub2-2 Block',
                  useModel: 'Sub2BlockModel',
                },
              ],
            },
          ]}
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

class Sub2BlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h2>Sub2 Block</h2>
        <p>This is a sub block rendered by Sub2BlockModel.</p>
      </div>
    );
  }
}

class PluginHelloModel extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ HelloBlockModel, Sub1BlockModel, Sub2BlockModel });
    const model = this.flowEngine.createModel({
      uid: 'my-model',
      use: 'HelloBlockModel',
    });
    // 注册路由，渲染模型
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} />,
    });
  }
}

// 创建应用实例，注册插件
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
