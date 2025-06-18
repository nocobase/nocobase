import { Plugin } from '@nocobase/client';
import { defineFlow, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, ConfigProvider, theme } from 'antd';
import React from 'react';
import { createApp } from './createApp';

class MyPopupModel extends FlowModel {
  render() {
    return (
      <Button
        {...this.props}
        onClick={(event) => {
          this.dispatchEvent('onClick', { event });
        }}
      >
        点击我
      </Button>
    );
  }
}

const myEventFlow = defineFlow({
  key: 'myEventFlow',
  on: {
    eventName: 'onClick',
  },
  steps: {
    step1: {
      handler(ctx, params) {
        ctx.globals.drawer.open({
          title: '命令式 Drawer',
          content: (
            <div>
              <p>这是命令式打开的 Drawer1 内容</p>
              <Button
                onClick={() => {
                  ctx.globals.drawer.open({
                    title: '命令式 Drawer',
                    content: (
                      <div>
                        <p>这是命令式打开的 Drawer2 内容</p>
                      </div>
                    ),
                  });
                }}
              >
                Show
              </Button>
            </div>
          ),
        });
      },
    },
  },
});

MyPopupModel.registerFlow(myEventFlow);

function CustomConfigProvider({ children }) {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#52c41a',
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}

class PluginDemo extends Plugin {
  async load() {
    this.flowEngine.registerModels({ MyPopupModel });
    const model = this.flowEngine.createModel({
      use: 'MyPopupModel',
    });
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} showFlowSettings />,
    });
    this.app.providers.unshift([CustomConfigProvider, {}]);
  }
}

export default createApp({ plugins: [PluginDemo] });
