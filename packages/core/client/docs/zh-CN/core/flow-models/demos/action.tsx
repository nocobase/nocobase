import React from 'react';
import { Button, ButtonProps, message, Modal } from 'antd';
import { Application, Plugin } from '@nocobase/client';
import { ActionModel, useFlowModel, withFlowModel, FlowsFloatContextMenu } from '@nocobase/flow-engine';

const ButtonModel = ActionModel.extends([
  {
    key: 'buttonActionFlow',
    title: '按钮操作流程',
    on: {
      eventName: 'onClick',
    },
    steps: {
      popconfirm: {
        title: '确认弹窗',
        use: 'showConfirm',
        defaultParams: {
          title: '确认删除',
          message: '确定要删除此记录吗？此操作不可撤销！',
        },
      },
      delete: {
        title: '执行删除',
        handler: async (ctx) => {
          // 模拟API请求
          await new Promise((resolve) => setTimeout(resolve, 500));
          ctx.message = message;
          ctx.message.success('删除成功');
        },
      },
      refresh: {
        title: '刷新页面',
        handler: () => {
          console.log('页面已刷新');
        },
      },
    },
  },
  {
    key: 'default',
    patch: true,
    steps: {
      setText: {
        defaultParams: {
          text: '删除',
        },
      },
    },
  },
]);

// ActionButton 演示组件
const Demo = () => {
  const uid = 'delete-button';
  const model = useFlowModel(uid, 'ButtonModel');
  return (
    <div style={{ padding: 24, background: '#f5f5f5', borderRadius: 8 }}>
      <DeleteButton model={model} />
    </div>
  );
};

const ButtonComponent = (props: ButtonProps & { text?: string }) => {
  const { text, ...rest } = props;
  return <Button {...rest}>{text}</Button>;
};

// 使用withFlowModel包装Button组件，只启用右键菜单
const DeleteButton = withFlowModel(ButtonComponent, {
  settings: {
    component: FlowsFloatContextMenu,
    props: {
      hideRemoveInSettings: true,
    },
  },
});

// 插件定义
class DemoPlugin extends Plugin {
  async load() {
    // 1. 注册ButtonModel模型
    this.app.flowEngine.registerModels({ ButtonModel });

    // 2. 注册确认弹窗Action
    this.app.flowEngine.registerAction({
      name: 'showConfirm',
      title: '显示确认弹窗',
      uiSchema: {
        title: {
          type: 'string',
          title: '弹窗标题',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
        message: {
          type: 'string',
          title: '弹窗内容',
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      defaultParams: {
        title: '确认操作',
        message: '确定要执行此操作吗？',
      },
      handler: async (ctx, params) => {
        return new Promise((resolve) => {
          Modal.confirm({
            title: params.title,
            content: params.message,
            onOk: () => {
              resolve(true);
            },
            onCancel: () => {
              resolve(false);
              ctx.exit();
            },
          });
        });
      },
    });

    // 注册路由
    this.app.router.add('root', { path: '/', Component: Demo });
  }
}

// 创建应用实例
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [DemoPlugin],
});

export default app.getRootComponent();
