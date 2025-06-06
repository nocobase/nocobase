import { define, observable } from '@formily/reactive';
import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import React from 'react';

class Collection {
  title: string;
  constructor(options: { title: string }) {
    this.title = options.title;
    define(this, {
      title: observable.ref,
    });
  }
}

class ConfigureFieldsFlowModel extends FlowModel {
  meta = observable.shallow({
    collection: null,
  });

  onInit(options: any) {}

  set collection(value: Collection) {
    this.meta.collection = value;
  }

  get collection() {
    return this.meta.collection;
  }

  render() {
    return <div>{this.collection.title}</div>;
  }
}

const collections = {
  users: new Collection({
    title: 'Users',
  }),
  roles: new Collection({
    title: 'Roles',
  }),
};

ConfigureFieldsFlowModel.registerFlow<ConfigureFieldsFlowModel>({
  key: 'myFlow',
  auto: true,
  steps: {
    step1: {
      uiSchema: {
        collectionName: {
          'x-component': 'Select',
          enum: Object.keys(collections).map((key) => ({
            label: collections[key].title,
            value: key,
          })),
          'x-decorator': 'FormItem',
        },
      },
      async handler(ctx, params) {
        ctx.model.collection = collections[params.collectionName];
      },
    },
  },
});

// 插件定义
class PluginTableBlockModel extends Plugin {
  async load() {
    this.flowEngine.registerModels({ ConfigureFieldsFlowModel });
    const model = this.flowEngine.createModel({
      use: 'ConfigureFieldsFlowModel',
      stepParams: {
        myFlow: {
          step1: {
            collectionName: 'roles',
            dataSourceKey: 'main',
          },
        },
      },
    });
    this.router.add('root', {
      path: '/',
      element: (
        <div>
          <FlowModelRenderer model={model} showFlowSettings />
        </div>
      ),
    });
  }
}

// 创建应用实例
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginTableBlockModel],
});

export default app.getRootComponent();
