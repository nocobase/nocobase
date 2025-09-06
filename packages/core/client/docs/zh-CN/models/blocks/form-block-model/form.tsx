import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer, useFlowModelContext } from '@nocobase/flow-engine';
import { Form, FormInstance, Input } from 'antd';
import React from 'react';

function FormComponent(props) {
  const [form] = Form.useForm();
  const ctx = useFlowModelContext();
  ctx.defineProperty('form', {
    get: () => form,
    cache: true,
  });
  return (
    <Form layout="vertical" {...ctx.model.props}>
      {props.children}
    </Form>
  );
}

class FormBlockModel extends FlowModel {
  protected onMount() {
    this.context.form?.setFieldsValue({ name: 'NocoBase' });
  }

  render() {
    return <FormComponent>{this.renderChildren()}</FormComponent>;
  }

  renderChildren() {
    return (
      <>
        <Form.Item label="Name" name="name">
          <Input />
        </Form.Item>
        <Form.Item label="Name" name="name">
          <Input />
        </Form.Item>
        表单值：
        <pre>{JSON.stringify(this.context.form?.getFieldsValue(), null, 2)}</pre>
      </>
    );
  }
}

class PluginHelloModel extends Plugin {
  async load() {
    // 注册 HelloModel 到 flowEngine
    this.flowEngine.registerModels({ FormBlockModel });

    // 创建 HelloModel 的实例（仅用于示例）
    const model = this.flowEngine.createModel({
      use: 'FormBlockModel',
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
