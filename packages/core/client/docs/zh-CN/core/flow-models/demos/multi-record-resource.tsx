import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer, MultiRecordResource } from '@nocobase/flow-engine';
import { Button, Space } from 'antd';
import React from 'react';

// 模拟 APIClient
class MockAPIClient {
  private mockData = [
    { id: 1, title: 'First Post', content: 'Content 1' },
    { id: 2, title: 'Second Post', content: 'Content 2' },
    { id: 3, title: 'Third Post', content: 'Content 3' },
  ];

  async request(options: any) {
    console.log('Mock API Request:', options);

    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 300));

    const { url, params, data } = options;

    if (url?.includes(':list')) {
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 20;
      const start = (page - 1) * pageSize;
      const items = this.mockData.slice(start, start + pageSize);

      return {
        data: {
          items,
          meta: { page, pageSize, total: this.mockData.length },
        },
      };
    }

    if (url?.includes(':create')) {
      const newItem = { ...data, id: Math.floor(Math.random() * 10000) };
      this.mockData.push(newItem);
      return { data: newItem };
    }

    if (url?.includes(':update')) {
      const filterByTk = params?.filterByTk;
      const index = this.mockData.findIndex((item) => item.id === filterByTk);
      if (index !== -1) {
        this.mockData[index] = { ...this.mockData[index], ...data };
        return { data: this.mockData[index] };
      }
    }

    if (url?.includes(':destroy')) {
      const filterByTk = params?.filterByTk;
      const index = this.mockData.findIndex((item) => item.id === filterByTk);
      if (index !== -1) {
        const deleted = this.mockData.splice(index, 1)[0];
        return { data: deleted };
      }
    }

    return { data: this.mockData };
  }
}

class MultiRecordFlowModel extends FlowModel {
  resource: MultiRecordResource = new MultiRecordResource(new MockAPIClient() as any, {
    resourceName: 'posts',
    page: 1,
    pageSize: 3,
  });

  async onInit() {
    // 初始化时加载数据
    await this.resource.refresh();
  }

  render() {
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <strong>Page:</strong> {this.resource.meta.page} |<strong> PageSize:</strong> {this.resource.meta.pageSize} |
          <strong> Total:</strong> {this.resource.meta.meta?.total || 0}
        </div>
        <pre>{JSON.stringify(this.resource.getData(), null, 2)}</pre>
        <Space wrap>
          <Button onClick={() => this.resource.refresh()}>Refresh</Button>
          <Button onClick={() => this.resource.next()}>Next Page</Button>
          <Button onClick={() => this.resource.previous()}>Previous Page</Button>
          <Button onClick={() => this.resource.goto(1)}>Go to Page 1</Button>
          <Button
            onClick={() =>
              this.resource.create({
                title: `New Post ${Date.now()}`,
                content: 'New content created',
              })
            }
          >
            Create
          </Button>
          <Button
            onClick={() => {
              const firstItem = this.resource.getData()[0];
              if (firstItem) {
                this.resource.update(firstItem.id, {
                  title: `Updated ${Date.now()}`,
                });
              }
            }}
          >
            Update First
          </Button>
          <Button
            onClick={() => {
              const firstItem = this.resource.getData()[0];
              if (firstItem) {
                this.resource.destroy(firstItem.id);
              }
            }}
          >
            Delete First
          </Button>
        </Space>
      </div>
    );
  }
}

class PluginMultiRecordDemo extends Plugin {
  async load() {
    this.flowEngine.registerModels({ MultiRecordFlowModel });
    const model = this.flowEngine.createModel({
      use: 'MultiRecordFlowModel',
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
  plugins: [PluginMultiRecordDemo],
});

export default app.getRootComponent();
