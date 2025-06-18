import * as icons from '@ant-design/icons';
import { FormDialog } from '@formily/antd-v5';
import { Plugin } from '@nocobase/client';
import { defineFlow, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, ConfigProvider, Drawer, theme } from 'antd';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createApp } from './createApp';

function showDrawer(props: { title?: string; content?: React.ReactNode }) {
  const div = document.createElement('div');
  document.body.appendChild(div);

  const root = ReactDOM.createRoot(div);

  function close() {
    root.unmount();
    div.remove();
  }

  const onClose = () => {
    close();
  };

  root.render(
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#52c41a',
        },
      }}
    >
      <Drawer
        open={true}
        title={props.title || '抽屉标题'}
        onClose={onClose}
        destroyOnClose
        footer={
          <Button type="primary" onClick={onClose}>
            关闭
          </Button>
        }
      >
        {props.content || '这是抽屉内容'}
      </Drawer>
    </ConfigProvider>,
  );

  // 返回关闭函数，调用者可以手动关闭
  return {
    close,
  };
}

// 自定义模型类，继承自 FlowModel
class MyPopupModel extends FlowModel {
  render() {
    console.log('Rendering MyModel with props:', this.props);
    return (
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: '#52c41a',
          },
        }}
      >
        <Button
          {...this.props}
          onClick={(event) => {
            this.dispatchEvent('onClick', { event });
          }}
        >
          点击我
        </Button>
      </ConfigProvider>
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
        const drawer = showDrawer({
          title: '命令式 Drawer',
          content: <div>这是命令式打开的 Drawer 内容</div>,
        });
      },
    },
  },
});

MyPopupModel.registerFlow(myEventFlow);

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
  }
}

export default createApp({ plugins: [PluginDemo] });
