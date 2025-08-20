import {
  Application,
  Plugin,
  FieldModelRenderer,
  FormItemV2 as FormItem,
  DateTimeNoTzFieldModel,
  DateOnlyFieldModel,
  DateTimeTzFieldModel,
  FormItemModel,
  DateOnlyPicker,
  FormComponent,
} from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Form, DatePicker } from 'antd';
import React from 'react';

class HelloModel extends FlowModel {
  render() {
    return (
      <FormComponent
        model={this}
        layoutProps={{ layout: 'vertical' }}
        initialValues={{
          dateOnly: '2026-03-22',
          dateTimeTz: '2015-04-25T16:00:10.000Z',
          dateTimeNoTz: '2015-04-18 12:04:55',
          dateOnly1: '2025-03-19',
        }}
      >
        <FormItem label="DateOnly" name="dateOnly">
          <FieldModelRenderer model={this.subModels.dateOnly} />
        </FormItem>
        <FormItem label="DateTimeTz" name="dateTimeTz">
          <FieldModelRenderer model={this.subModels.dateTimeTz} showTime />
        </FormItem>
        <FormItem label="DateTimeNoTz" name="dateTimeNoTz">
          <FieldModelRenderer model={this.subModels.dateTimeNoTz} showTime />
        </FormItem>
        <FormItem rules={[{ required: true }]} label="DateOnly1" name="dateOnly1">
          <DateOnlyPicker />
        </FormItem>
        <FormItem rules={[{ required: true }]} label="Date" name="date">
          <DatePicker showTime />
        </FormItem>
        <Form.Item noStyle shouldUpdate>
          {() => (
            <div>
              当前表单值：<pre>{JSON.stringify(this.context.form.getFieldsValue(), null, 2)}</pre>
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
    this.flowEngine.registerModels({
      HelloModel,
      DateTimeNoTzFieldModel,
      DateOnlyFieldModel,
      DateTimeTzFieldModel,
      FormItemModel,
    });

    // 创建 HelloModel 的实例（仅用于示例）
    const model = this.flowEngine.createModel({
      use: 'HelloModel',
      subModels: {
        dateOnly: {
          use: 'DateOnlyFieldModel',
        },
        dateTimeTz: {
          use: 'DateTimeTzFieldModel',
        },
        dateTimeNoTz: {
          use: 'DateTimeNoTzFieldModel',
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
