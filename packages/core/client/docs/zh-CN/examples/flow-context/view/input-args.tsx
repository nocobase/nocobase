import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer, observable } from '@nocobase/flow-engine';
import { Button, Input, Space, Typography } from 'antd';
import React from 'react';

class HelloBlockModel extends FlowModel {
  inputArgs = observable.shallow({ var1: 'Hello, world!' });
  render() {
    return (
      <Space.Compact>
        <Input
          defaultValue={this.inputArgs.var1}
          onChange={(e) => {
            this.inputArgs.var1 = e.target.value;
          }}
          placeholder="Type something..."
        />
        <Button
          onClick={() => {
            this.context.viewer.dialog({
              // width: 800,
              content: (view) => {
                return (
                  <Typography.Paragraph>
                    <pre>{JSON.stringify(view.inputArgs, null, 2)}</pre>
                  </Typography.Paragraph>
                );
              },
              inputArgs: this.inputArgs,
            });
          }}
        >
          Open dialog
        </Button>
      </Space.Compact>
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
