import { Application, Plugin } from '@nocobase/client';
import { Collection, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import React from 'react';

class HelloBlockModel extends FlowModel {
  collection: Collection;

  get dataSource() {
    return this.context.dataSourceManager.getDataSource('main');
  }

  render() {
    return (
      <div>
        <h3>Data source</h3>
        <div>{this.dataSource.displayName}</div>
        <h3>Collection</h3>
        <div>{this.collection.title}</div>
      </div>
    );
  }
}

HelloBlockModel.registerFlow({
  key: 'ref-example',
  title: 'Ref Example',
  steps: {
    step1: {
      handler: async (ctx) => {
        const dataSource = ctx.dataSourceManager.getDataSource('main');
        ctx.model.collection = dataSource.getCollection('collection1');
      },
    },
  },
});

class PluginHelloModel extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ HelloBlockModel });
    // 全局注册
    const dataSource = this.flowEngine.context.dataSourceManager.getDataSource('main');
    dataSource.addCollection({
      name: 'collection1',
      title: 'Collection 1',
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

// 创建应用实例，注册插件
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
