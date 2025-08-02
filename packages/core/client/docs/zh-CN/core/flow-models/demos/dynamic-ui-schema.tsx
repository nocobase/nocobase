import { Input, Select, NumberPicker, Switch } from '@formily/antd-v5';
import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Card, Space, Button } from 'antd';
import React from 'react';

class SimpleFormModel extends FlowModel {
  render() {
    const { formType = 'user', advancedMode = false, config = {} } = this.props;

    return (
      <Card title={`${formType}表单 ${advancedMode ? '(高级)' : '(基础)'}`} style={{ width: 250, margin: 8 }}>
        <p>
          <strong>类型:</strong> {formType}
        </p>
        <p>
          <strong>模式:</strong> {advancedMode ? '高级' : '基础'}
        </p>
        <p>
          <strong>配置:</strong> {Object.keys(config).length}项
        </p>
      </Card>
    );
  }
}

// 注册动态表单配置流程
SimpleFormModel.registerFlow('configFlow', {
  title: '表单配置',
  steps: {
    // 第一步：基础设置
    basicSettings: {
      title: '基础设置',
      paramsRequired: true,
      uiSchema: {
        formType: {
          type: 'string',
          title: '表单类型',
          'x-component': Select,
          'x-decorator': 'FormItem',
          enum: [
            { label: '用户', value: 'user' },
            { label: '产品', value: 'product' },
          ],
        },
        advancedMode: {
          type: 'boolean',
          title: '高级模式',
          'x-component': Switch,
          'x-decorator': 'FormItem',
        },
      },
      defaultParams: {
        formType: 'user',
        advancedMode: false,
      },
      handler(ctx, params) {
        ctx.model.setProps({
          formType: params.formType,
          advancedMode: params.advancedMode,
        });
      },
    },

    // 第二步：详细配置 - 🔥 关键：动态 uiSchema
    detailConfig: {
      title: '详细配置',
      paramsRequired: true,
      // 🔥 动态 uiSchema - 简单测试
      uiSchema: (ctx) => {
        const { formType, advancedMode } = ctx.model.getProps();

        return {
          name: {
            type: 'string',
            title: `${formType} 名称`,
            'x-component': Input,
            'x-decorator': 'FormItem',
          },
          ...(advancedMode && {
            extra: {
              type: 'string',
              title: '额外信息',
              'x-component': Input,
              'x-decorator': 'FormItem',
            },
          }),
        };
      },
      // 动态默认值
      defaultParams: (ctx) => {
        const { formType } = ctx.model.getProps();
        return formType === 'user' ? { name: '新用户', role: 'user' } : { name: '新产品', price: 100 };
      },
      handler(ctx, params) {
        ctx.model.setProps('config', params);
      },
    },
  },
});

class PluginDynamicUiSchema extends Plugin {
  async load() {
    this.flowEngine.registerModels({ SimpleFormModel });

    // 创建简单表单模型
    const model = this.flowEngine.createModel({
      uid: 'simple-form',
      use: 'SimpleFormModel',
      props: { formType: 'user', advancedMode: false },
    });

    await model.applyAutoFlows();

    this.router.add('root', {
      path: '/',
      element: (
        <div style={{ padding: 20 }}>
          <h2>动态 uiSchema 演示</h2>
          <p>
            这个示例展示了 uiSchema 的动态功能：
            <br />
            1. 先设置表单类型和高级模式
            <br />
            2. 再配置详细信息时，界面根据类型和模式动态变化
          </p>

          <div style={{ marginTop: 20 }}>
            <FlowModelRenderer model={model} showFlowSettings />
          </div>

          <Card>
            <Space direction="vertical">
              <Button
                onClick={() => {
                  model.setStepParams('configFlow', 'basicSettings', {
                    formType: 'user',
                    advancedMode: false,
                  });
                  model.applyFlow('configFlow');
                }}
              >
                用户表单（基础）
              </Button>
              <Button
                onClick={() => {
                  model.setStepParams('configFlow', 'basicSettings', {
                    formType: 'user',
                    advancedMode: true,
                  });
                  model.applyFlow('configFlow');
                }}
              >
                用户表单（高级）
              </Button>
              <Button
                onClick={() => {
                  model.setStepParams('configFlow', 'basicSettings', {
                    formType: 'product',
                    advancedMode: true,
                  });
                  model.applyFlow('configFlow');
                }}
              >
                产品表单（高级）
              </Button>
            </Space>
          </Card>
        </div>
      ),
    });
  }
}

// 创建应用实例
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginDynamicUiSchema],
});

export default app.getRootComponent();
