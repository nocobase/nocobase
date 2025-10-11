import { PlusOutlined } from '@ant-design/icons';
import { Application, BlockModel, Plugin } from '@nocobase/client';
import { AddSubModelButton, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Card, Space } from 'antd';
import React from 'react';

function AddBlock(props: { model: FlowModel; children?: React.ReactNode }) {
  const { model, children } = props;
  return (
    <AddSubModelButton
      model={model}
      subModelKey={'items'}
      items={[
        {
          key: 'sub1',
          label: 'Sub1 Block',
          createModelOptions: {
            use: 'Sub1BlockModel',
          },
        },
      ]}
    >
      {children}
    </AddSubModelButton>
  );
}

class HelloBlockModel extends FlowModel {
  render() {
    return (
      <Card>
        <Space direction="vertical" style={{ width: '100%' }}>
          {this.mapSubModels('items', (item) => {
            return <FlowModelRenderer key={item.uid} model={item} showFlowSettings={{ showBorder: true }} />;
          })}
          <Space>
            <AddBlock model={this}>
              <Button>Add block</Button>
            </AddBlock>
            <AddBlock model={this}>
              <a>
                <PlusOutlined /> Add block
              </a>
            </AddBlock>
          </Space>
        </Space>
      </Card>
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

class PluginHelloModel extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ HelloBlockModel, Sub1BlockModel });
    const model = this.flowEngine.createModel({
      uid: 'my-model',
      use: 'HelloBlockModel',
    });
    // 注册路由，渲染模型
    this.router.add('root', {
      path: '/',
      element: (
        <FlowModelRenderer
          model={model}
          showFlowSettings={{ showBorder: true }}
          hideRemoveInSettings
          extraToolbarItems={[
            {
              key: 'add-block',
              component: () => {
                return (
                  <AddBlock model={model}>
                    <PlusOutlined />
                  </AddBlock>
                );
              },
              sort: 1,
            },
          ]}
        />
      ),
    });
  }
}

// 创建应用实例，注册插件
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
