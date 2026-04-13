import { Application, Plugin, BlockModel } from '@nocobase/client-v2';
import { AddSubModelButton, FlowModel, FlowModelContext, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Form, Input, Space } from 'antd';

class HelloBlockModel extends FlowModel {
  render() {
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        {this.mapSubModels('items', (item) => {
          return (
            <FlowModelRenderer
              key={item.uid}
              model={item}
              showFlowSettings={{ showBorder: false, showBackground: true }}
            />
          );
        })}
        <AddSubModelButton model={this} subModelKey="items" subModelBaseClasses={['BaseFieldModel']}>
          <Button>Configure fields</Button>
        </AddSubModelButton>
      </Space>
    );
  }
}

class BaseFieldModel extends BlockModel {
  static defineChildren(ctx: FlowModelContext) {
    const collection = ctx.dataSourceManager.getCollection('main', 'tests');
    return collection.getFields().map((field) => {
      return {
        key: field.name,
        label: field.title,
        createModelOptions: {
          use: 'FieldModel',
          props: {
            fieldName: field.name,
          },
        },
      };
    });
  }
}

BaseFieldModel.define({
  label: 'Fields',
});

class FieldModel extends FlowModel {
  render() {
    return (
      <div>
        <Form.Item layout="vertical" label={this.props.fieldName}>
          <Input />
        </Form.Item>
      </div>
    );
  }
}

class PluginHelloModel extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    const mainDataSource = this.flowEngine.context.dataSourceManager.getDataSource('main');
    mainDataSource.addCollection({
      name: 'tests',
      title: 'Tests',
      fields: [
        {
          name: 'name',
          type: 'string',
          title: 'Name',
          interface: 'input',
        },
        {
          name: 'title',
          type: 'string',
          title: 'Title',
          interface: 'input',
        },
      ],
    });
    this.flowEngine.registerModels({
      HelloBlockModel,
      BaseFieldModel,
      FieldModel,
    });
    const model = this.flowEngine.createModel({
      uid: 'my-model',
      use: 'HelloBlockModel',
    });
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
