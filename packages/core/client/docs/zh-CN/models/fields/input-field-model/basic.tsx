import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Form, Input } from 'antd';
import React, { useEffect } from 'react';

function FieldModelRenderer(props) {
  const { model, id, value, onChange, ['aria-describedby']: ariaDescribedby, ...rest } = props;
  useEffect(() => {
    model.setProps({ id, value, onChange, ['aria-describedby']: ariaDescribedby });
  }, [model, id, value, ariaDescribedby, onChange]);
  return <FlowModelRenderer model={model} {...rest} />;
}

function Text(props) {
  const { value } = props;
  return <span>{value}</span>;
}

class HelloModel extends FlowModel {
  render() {
    return (
      <Form layout="vertical" initialValues={{ name: 'NocoBase', age: 18, obj: { a: 'a' } }}>
        <Form.Item
          label="Name"
          name="name"
          tooltip="What do you want others to call you?"
          extra="We must make sure that your are a human."
        >
          <FieldModelRenderer model={this.subModels.field} />
        </Form.Item>
        <Form.Item label="Age" name="age">
          <Text />
        </Form.Item>
        <Form.Item required rules={[{ required: true }]} label="A" name={['obj', 'a']}>
          <Input />
        </Form.Item>
      </Form>
    );
  }
}

class InputModel extends FlowModel {
  render() {
    return <Input {...this.props} />;
  }
}

class FormItemModel extends FlowModel {
  setLabel(label) {
    this.setProps({ label });
  }
  render() {
    return <Form.Item {...this.props} />;
  }
}

class CollectionFieldItemModel extends FormItemModel {
  render() {
    return <Form.Item {...this.props} />;
  }
}

class PluginHelloModel extends Plugin {
  async load() {
    // 注册 HelloModel 到 flowEngine
    this.flowEngine.registerModels({ HelloModel, InputModel, FormItemModel });

    // 创建 HelloModel 的实例（仅用于示例）
    const model = this.flowEngine.createModel({
      use: 'HelloModel',
      subModels: {
        field: {
          use: 'InputModel',
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
