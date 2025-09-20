import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Space } from 'antd';
import React from 'react';

class HelloBlockModel extends FlowModel {
  containerRef = React.createRef<HTMLDivElement>();
  buttonRef1 = React.createRef<HTMLButtonElement>();
  buttonRef2 = React.createRef<HTMLButtonElement>();
  render() {
    return (
      <div id="hello-popover-1" ref={this.containerRef}>
        <Space>
          <Button
            ref={this.buttonRef1}
            onClick={() => {
              this.context.viewer.open({
                type: 'popover',
                getPopupContainer(triggerNode) {
                  return document.getElementById('hello-popover-1') || triggerNode.parentElement;
                },
                // width: 800,
                content: 'This is a view opened from the flow context.',
                closeOnEsc: true,
                target: this.buttonRef1.current,
              });
            }}
          >
            Open Popover
          </Button>
          <Button
            ref={this.buttonRef2}
            onClick={() => {
              this.context.viewer.popover({
                type: 'popover',
                getPopupContainer(triggerNode) {
                  return document.getElementById('hello-popover-1') || triggerNode.parentElement;
                },
                // width: 800,
                content: 'This is a view opened from the flow context.',
                closeOnEsc: true,
                // trigger: ['hover'],
                placement: 'bottom',
                target: this.buttonRef2.current,
              });
            }}
          >
            Open Popover
          </Button>
        </Space>
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
