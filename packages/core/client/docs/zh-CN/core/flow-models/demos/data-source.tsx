import { uid } from '@formily/shared';
import { Application, Plugin } from '@nocobase/client';
import { DataSource, DataSourceManager, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button } from 'antd';
import React from 'react';

const dsm = new DataSourceManager();
dsm.addDataSource({
  name: 'main',
  displayName: 'Main',
});
class ConfigureFieldsFlowModel extends FlowModel {
  render() {
    return (
      <div>
        {dsm.dataSources.size}
        {dsm.getDataSource('main')?.options?.displayName}
        <Button
          onClick={() => {
            const ds2 = new DataSource({
              name: `ds-${uid()}`,
              displayName: `ds-${uid()}`,
            });
            dsm.addDataSource(ds2);
          }}
        >
          Add new
        </Button>
        <Button
          onClick={() => {
            dsm.dataSources.clear();
          }}
        >
          Clear
        </Button>
      </div>
    );
  }
}

ConfigureFieldsFlowModel.registerFlow({
  key: 'myFlow',
  auto: true,
  steps: {
    step1: {
      // uiSchema: {
      //   collectionName: {
      //     'x-component': 'Select',
      //     enum: Object.keys(collections).map((key) => ({
      //       label: collections[key].title,
      //       value: key,
      //     })),
      //     'x-decorator': 'FormItem',
      //   },
      // },
      async handler(ctx, params) {
        console.log('step1 handler', ctx, params);
        dsm.addDataSource({
          name: `ds-${uid()}`,
          displayName: `ds-${uid()}`,
        });
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
