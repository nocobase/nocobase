import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer, SingleRecordResource } from '@nocobase/flow-engine';
import { Button, Space } from 'antd';
import React from 'react';

// 模拟 APIClient
class MockAPIClient {
  private mockData = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    updatedAt: new Date().toISOString(),
  };

  async request(options: any) {
    console.log('Mock API Request:', options);

    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 200));

    const { url, data } = options;

    if (url?.includes(':get')) {
      return { data: this.mockData };
    }

    if (url?.includes(':update')) {
      this.mockData = {
        ...this.mockData,
        ...data,
        updatedAt: new Date().toISOString(),
      };
      return { data: this.mockData };
    }

    if (url?.includes(':destroy')) {
      const deleted = { ...this.mockData };
      this.mockData = null;
      return { data: deleted };
    }

    return { data: this.mockData };
  }
}

class SingleRecordFlowModel extends FlowModel {
  resource: SingleRecordResource = new SingleRecordResource(new MockAPIClient() as any, {
    resourceName: 'users',
    filterByTk: 1,
  });

  async onInit() {
    // 初始化时加载数据
    await this.resource.refresh();
  }

  render() {
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <strong>Resource:</strong> {this.resource.meta.resourceName} |<strong> FilterByTk:</strong>{' '}
          {this.resource.meta.filterByTk}
        </div>
        <pre>{JSON.stringify(this.resource.getData(), null, 2)}</pre>
        <Space>
          <Button onClick={() => this.resource.refresh()}>Refresh</Button>
          <Button
            onClick={() =>
              this.resource.save({
                ...this.resource.getData(),
                name: `Updated ${Date.now()}`,
                email: `updated${Date.now()}@example.com`,
              })
            }
          >
            Save
          </Button>
          <Button onClick={() => this.resource.destroy()} danger>
            Delete
          </Button>
        </Space>
      </div>
    );
  }
}

class PluginSingleRecordDemo extends Plugin {
  async load() {
    this.flowEngine.registerModels({ SingleRecordFlowModel });
    const model = this.flowEngine.createModel({
      use: 'SingleRecordFlowModel',
    });
    this.router.add('root', {
      path: '/',
      element: (
        <div>
          <FlowModelRenderer model={model} />
        </div>
      ),
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginSingleRecordDemo],
});

export default app.getRootComponent();
