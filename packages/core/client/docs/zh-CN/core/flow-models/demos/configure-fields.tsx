import { Application, Plugin } from '@nocobase/client';
import { Collection, DataSource, DataSourceManager, Field, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Dropdown, Input } from 'antd';
import React from 'react';

const dsm = new DataSourceManager();
const ds = new DataSource({
  name: 'main',
  displayName: 'Main',
  description: 'This is the main data source',
});

dsm.addDataSource(ds);

ds.addCollection({
  name: 'roles',
  title: 'Roles',
  fields: [
    {
      name: 'name',
      type: 'string',
      title: 'Name',
    },
    {
      name: 'uid',
      type: 'string',
      title: 'UID',
    },
  ],
});

ds.addCollection({
  name: 'users',
  title: 'Users',
  fields: [
    {
      name: 'username',
      type: 'string',
      title: 'Username',
    },
    {
      name: 'nickname',
      type: 'string',
      title: 'Nickname',
    },
  ],
});

class FieldModel extends FlowModel {
  field: Field;
  render() {
    return (
      <div>
        <Input
          value={this.field.title}
          onChange={(e) => {
            const field = dsm.getCollectionField(this.stepParams.default.step1.fieldPath);
            if (!field) {
              console.error('Field not found:', this.stepParams.default.step1.fieldPath);
              return;
            }
            field.title = e.target.value;
          }}
        />
      </div>
    );
  }
}

FieldModel.registerFlow({
  key: 'default',
  auto: true,
  steps: {
    step1: {
      handler(ctx, params) {
        if (ctx.model.field) {
          return;
        }
        ctx.model.field = dsm.getCollectionField(params.fieldPath);
      },
    },
  },
});

type S = {
  subModels: {
    fields: FieldModel[];
  };
};

class ConfigureFieldsFlowModel extends FlowModel<S> {
  collection: Collection;

  getFieldMenuItems() {
    return this.collection.mapFields((field) => {
      return {
        key: `${this.collection.dataSource.name}.${this.collection.name}.${field.name}`,
        label: field.title,
      };
    });
  }

  render() {
    return (
      <div>
        {this.mapSubModels('fields', (field) => (
          <FlowModelRenderer key={field.uid} model={field} />
        ))}
        <Dropdown
          menu={{
            items: this.getFieldMenuItems(),
            onClick: (info) => {
              const model = this.addSubModel('fields', {
                use: 'FieldModel',
                stepParams: {
                  default: {
                    step1: {
                      fieldPath: info.key,
                    },
                  },
                },
              });
            },
          }}
        >
          <Button>Configure fields</Button>
        </Dropdown>
      </div>
    );
  }
}

ConfigureFieldsFlowModel.registerFlow({
  key: 'default',
  auto: true,
  steps: {
    step1: {
      uiSchema: {
        dataSourceKey: {
          type: 'string',
          title: 'DataSource Name',
          'x-component': 'Input',
          'x-decorator': 'FormItem',
        },
        collectionName: {
          type: 'string',
          title: 'Collection Name',
          'x-component': 'Input',
          'x-decorator': 'FormItem',
        },
      },
      handler(ctx, params) {
        if (ctx.model.collection) {
          return;
        }
        ctx.model.collection = dsm.getCollection(params.dataSourceKey, params.collectionName);
      },
    },
  },
});

class PluginTableBlockModel extends Plugin {
  async load() {
    this.flowEngine.registerModels({ FieldModel, ConfigureFieldsFlowModel });
    const model = this.flowEngine.createModel({
      use: 'ConfigureFieldsFlowModel',
      stepParams: {
        default: {
          step1: {
            dataSourceKey: 'main',
            collectionName: 'users',
          },
        },
      },
    });
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} showFlowSettings />,
    });
  }
}

// 创建应用实例
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginTableBlockModel],
});

export default app.getRootComponent();
