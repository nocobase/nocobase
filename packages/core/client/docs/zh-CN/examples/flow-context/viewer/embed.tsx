import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Card, Space } from 'antd';
import React from 'react';

class HelloBlockModel extends FlowModel {
  targetRef = React.createRef<HTMLDivElement>();
  render() {
    return (
      <div>
        <Space>
          <Button
            onClick={() => {
              this.context.viewer.open({
                type: 'embed',
                // width: 800,
                content: 'This is a embed view1.',
                target: this.targetRef.current,
              });
            }}
          >
            Open embed1
          </Button>
          <Button
            onClick={() => {
              this.context.viewer.embed({
                content: 'This is a embed view2.',
                target: this.targetRef.current,
              });
            }}
          >
            Open embed2
          </Button>
        </Space>
        <Card style={{ marginTop: 16 }}>
          <div ref={this.targetRef} />
        </Card>
      </div>
    );
  }
}

class PluginHelloModel extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ HelloBlockModel });
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

// 创建应用实例，注册插件
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
