import {
  Application,
  Plugin,
  FieldModelRenderer,
  FormItemV2 as FormItem,
  PercentFieldModel,
  PercentInput,
  FormComponent,
} from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Form } from 'antd';
import React from 'react';

class HelloModel extends FlowModel {
  render() {
    return (
      <FormComponent
        model={this}
        layoutProps={{ layout: 'vertical' }}
        initialValues={{ percent1: 0.01, percent2: 0.03 }}
      >
        <FormItem label="Percent field1" name="percent1">
          <FieldModelRenderer model={this.subModels.field} />
        </FormItem>
        <FormItem label="Percent field2" name="percent2">
          <PercentInput />
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
    this.flowEngine.registerModels({ HelloModel, PercentFieldModel });

    // 创建 HelloModel 的实例（仅用于示例）
    const model = this.flowEngine.createModel({
      use: 'HelloModel',
      subModels: {
        field: {
          use: 'PercentFieldModel',
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
