import { Application, FieldModelRenderer, FormComponent, FormItem, Plugin, SelectFieldModel } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Form, Select } from 'antd';
import React from 'react';

class HelloModel extends FlowModel {
  render() {
    return (
      <FormComponent
        model={this}
        layoutProps={{ layout: 'vertical' }}
        initialValues={{
          singleSelect: 'NocoBase',
          singleSelect1: 'lowCode',
          multipleSelect: ['apple', 'banana'],
          multipleSelect1: ['apple'],
        }}
      >
        <FormItem label="SingleSelect" name="singleSelect">
          <FieldModelRenderer
            model={this.subModels.field1}
            options={[
              {
                value: 'nocoBase',
                label: 'NocoBase',
              },
              {
                value: 'lowCode',
                label: 'LowCode',
              },
            ]}
          />
        </FormItem>
        <FormItem rules={[{ required: true }]} label="SingleSelect1" name="singleSelect1">
          <Select
            options={[
              {
                value: 'nocoBase',
                label: 'NocoBase',
              },
              {
                value: 'lowCode',
                label: 'LowCode',
              },
            ]}
          />
        </FormItem>
        <FormItem label="MultipleSelect" name="multipleSelect">
          <FieldModelRenderer
            model={this.subModels.field2}
            mode="multiple"
            options={[
              {
                value: 'apple',
                label: 'Apple',
              },
              {
                value: 'banana',
                label: 'Banana',
              },
              {
                value: 'orange',
                label: 'Orange',
              },
            ]}
          />
        </FormItem>
        <FormItem rules={[{ required: true }]} label="MultipleSelect1" name="multipleSelect1">
          <Select
            mode="multiple"
            options={[
              {
                value: 'apple',
                label: 'Apple',
              },
              {
                value: 'banana',
                label: 'Banana',
              },
              {
                value: 'orange',
                label: 'Orange',
              },
            ]}
          />
        </FormItem>
        <Form.Item noStyle shouldUpdate>
          {() => (
            <div>
              当前表单值：<pre>{JSON.stringify(this.context.form?.getFieldsValue(), null, 2)}</pre>
            </div>
          )}
        </Form.Item>
      </FormComponent>
    );
  }
}

class PluginHelloModel extends Plugin {
  async load() {
    // 注册 HelloModel 到 flowEngine
    this.flowEngine.registerModels({ HelloModel, SelectFieldModel });

    // 创建 HelloModel 的实例（仅用于示例）
    const model = this.flowEngine.createModel({
      use: 'HelloModel',
      subModels: {
        field1: {
          use: 'SelectFieldModel',
        },
        field2: {
          use: 'SelectFieldModel',
        },
      },
    });

    // 添加路由，将模型渲染到根路径（仅用于示例）
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} />,
    });
  }
}

// 创建应用实例，注册插件（仅用于示例）
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
