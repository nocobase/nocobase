import React from 'react';
import { Button, Divider, message, Modal } from 'antd';
import { FlowModel, Application, Plugin, FlowEngine, ActionModel } from '@nocobase/client';
import { observer } from '@formily/react';
import FlowSettings from '../settings/FlowSettings';

// 从 FlowEngine 解构出所需的 Hooks
const {
  useModelById,
  useApplyFlow,
  useContext: useFlowEngineContext,
  withFlowModel
} = FlowEngine;

// ActionButton 演示组件
const Demo = () => {
  const uid = 'delete-button';
  const model = useModelById(uid, 'ButtonModel');
  return (
    <div style={{ padding: 24, background: '#f5f5f5', borderRadius: 8 }}>
      <FlowSettings model={model} flowKey="setDeletePropsFlow" />
      <FlowSettings model={model} flowKey="buttonActionFlow" />
      <DeleteButton model={model} />
    </div>
  );
}

// 使用withFlowModel包装Button组件
const DeleteButton = withFlowModel(Button, { defaultFlow: 'setDeletePropsFlow' });

// 插件定义
class DemoPlugin extends Plugin {
  async load() {
    // 1. 注册ButtonModel模型
    this.app.flowEngine.registerModelClass('ButtonModel', ButtonModel);

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
        message: '确定要执行此操作吗？'
      },
      handler: async (ctx, model, params) => {
        return new Promise(resolve => {
          Modal.confirm({
            title: params.title,
            content: params.message,
            onOk: () => {
              resolve(true);
            },
            onCancel: () => {
              resolve(false);
              ctx.$exit();
            },
          });
        });
      },
    });

    // 3. 注册设置删除属性的流程
    this.app.flowEngine.registerFlow('ButtonModel', {
      key: 'setDeletePropsFlow',
      title: '设置删除按钮属性',
      steps: {
        setTitle: {
          title: '设置按钮文本',
          handler: (ctx, model, params) => {
            model.setProps('children', params.title);
          },
          uiSchema: {
            title: {
              type: 'string',
              title: '按钮文本',
              'x-decorator': 'FormItem',
              'x-component': 'Input',
            }
          },
          defaultParams: { title: '删除记录' }
        },
        setDanger: {
          title: '设置按钮状态',
          handler: (ctx, model, params) => {
            model.setProps('danger', params.danger);
            model.setProps('type', params.type);
          },
          uiSchema: {
            danger: {
              type: 'boolean',
              title: '是否危险',
              'x-decorator': 'FormItem',
              'x-component': 'Switch',
            },
            type: {
              type: 'string',
              title: '按钮类型',
              'x-decorator': 'FormItem',
              'x-component': 'Select',
              enum: [
                { label: '默认', value: 'default' },
                { label: '主要', value: 'primary' }
              ],
            },
          },
          defaultParams: { danger: true, type: 'primary' }
        },
        setOnClick: {
          title: '设置点击事件',
          handler: (ctx, model) => {
            model.setProps('onClick', () => {
              model.dispatchEvent('onClick', ctx);
            });
          }
        },
      }
    });

    // 4. 注册按钮操作流程
    this.app.flowEngine.registerFlow('ButtonModel', {
      key: 'buttonActionFlow',
      title: '按钮操作流程',
      on: {
        eventName: 'onClick'
      },
      steps: {
        popconfirm: { 
          use: 'showConfirm',
          defaultParams: { 
            title: '确认删除', 
            message: '确定要删除此记录吗？此操作不可撤销！' 
          }
        },
        delete: {
          title: '执行删除',
          handler: async (ctx) => {
            // 模拟API请求
            await new Promise(resolve => setTimeout(resolve, 500));
            ctx.message = message;
            ctx.message.success('删除成功');
          }
        },
        refresh: {
          title: '刷新页面',
          handler: (ctx) => {
            console.log('页面已刷新');
          }
        },
      }
    });

    // 注册路由
    this.app.router.add('root', { path: '/', Component: Demo });
  }
}

// 定义ButtonModel类继承FlowModel
class ButtonModel extends FlowModel {
  constructor(uid: string, app: Application) {
    super(uid, app);
  }
}

// 创建应用实例
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [DemoPlugin],
});

export default app.getRootComponent();
