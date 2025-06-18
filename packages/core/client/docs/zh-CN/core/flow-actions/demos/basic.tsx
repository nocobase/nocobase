import * as icons from '@ant-design/icons';
import { Plugin } from '@nocobase/client';
import { defineFlow, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button } from 'antd';
import React from 'react';
import { createApp } from './createApp';

// 自定义模型类，继承自 FlowModel
class MyModel extends FlowModel {
  render() {
    console.log('Rendering MyModel with props:', this.props);
    return (
      <Button
        {...this.props}
        onClick={(event) => {
          this.dispatchEvent('onClick', { event });
        }}
      />
    );
  }
}

const myPropsFlow = defineFlow({
  key: 'myPropsFlow',
  auto: true,
  title: '按钮配置',
  steps: {
    setProps: {
      title: '按钮属性设置',
      uiSchema: {
        title: {
          type: 'string',
          title: '按钮标题',
          'x-component': 'Input',
          'x-decorator': 'FormItem',
        },
        type: {
          type: 'string',
          title: '类型',
          'x-component': 'Select',
          'x-decorator': 'FormItem',
          enum: [
            { label: '主要', value: 'primary' },
            { label: '次要', value: 'default' },
            { label: '危险', value: 'danger' },
            { label: '虚线', value: 'dashed' },
            { label: '链接', value: 'link' },
            { label: '文本', value: 'text' },
          ],
        },
        icon: {
          type: 'string',
          title: '图标',
          'x-component': 'Select',
          'x-decorator': 'FormItem',
          enum: [
            { label: '搜索', value: 'SearchOutlined' },
            { label: '添加', value: 'PlusOutlined' },
            { label: '删除', value: 'DeleteOutlined' },
            { label: '编辑', value: 'EditOutlined' },
            { label: '设置', value: 'SettingOutlined' },
          ],
        },
      },
      defaultParams: {
        type: 'primary',
        title: 'Primary Button',
      },
      // 步骤处理函数，设置模型属性
      handler(ctx, params) {
        console.log('Setting props:', params);
        ctx.model.setProps('children', params.title);
        ctx.model.setProps('type', params.type);
        ctx.model.setProps('icon', params.icon ? React.createElement(icons[params.icon]) : undefined);
      },
    },
  },
});

MyModel.registerFlow(myPropsFlow);

class PluginDemo extends Plugin {
  async load() {
    this.flowEngine.registerModels({ MyModel });
    const model = this.flowEngine.createModel({
      use: 'MyModel',
    });
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} showFlowSettings />,
    });
  }
}

export default createApp({ plugins: [PluginDemo] });
