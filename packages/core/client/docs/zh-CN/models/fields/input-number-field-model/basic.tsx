import {
  Application,
  Plugin,
  FieldModelRenderer,
  FormItemV2 as FormItem,
  NumberFieldModel,
  FormComponent,
} from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Form, InputNumber } from 'antd';
import React, { useEffect } from 'react';

class HelloModel extends FlowModel {
  render() {
    return (
      <FormComponent model={this} layoutProps={{ layout: 'vertical' }} initialValues={{ age: 18, obj: { number: 11 } }}>
        <FormItem label="Age" name="age">
          <FieldModelRenderer model={this.subModels.field} />
        </FormItem>
        <FormItem rules={[{ required: true }]} label="number" name={['obj', 'number']}>
          <InputNumber />
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
    this.flowEngine.registerModels({ HelloModel, NumberFieldModel });

    // 创建 HelloModel 的实例（仅用于示例）
    const model = this.flowEngine.createModel({
      use: 'HelloModel',
      subModels: {
        field: {
          use: 'NumberFieldModel',
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
