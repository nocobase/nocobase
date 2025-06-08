import { faker } from '@faker-js/faker';
import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer, MultiRecordResource } from '@nocobase/flow-engine';
import { Button, Space } from 'antd';
import MockAdapter from 'axios-mock-adapter';
import React from 'react';

import { APIClient } from '@nocobase/sdk';

const api = new APIClient({
  baseURL: 'https://localhost:8000/api',
});

const mock = new MockAdapter(api.axios);

const records = [
  {
    id: 1,
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraph(),
  },
  {
    id: 2,
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraph(),
  },
  {
    id: 3,
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraph(),
  },
  {
    id: 4,
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraph(),
  },
  {
    id: 5,
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraph(),
  },
];

mock.onGet('posts:list').reply((config) => {
  const page = parseInt(config.params?.page) || 1;
  const pageSize = parseInt(config.params?.pageSize) || 3;
  const start = (page - 1) * pageSize;
  const items = records.slice(start, start + pageSize);

  return [
    200,
    {
      data: items,
      meta: { page, pageSize, total: records.length },
    },
  ];
});

mock.onPost('posts:create').reply((config) => {
  const newItem = {
    ...JSON.parse(config.data),
    id: Math.max(...records.map(r => r.id)) + 1,
  };
  records.push(newItem);
  return [
    200,
    {
      data: newItem,
    },
  ];
});

mock.onPost('posts:update').reply((config) => {
  const filterByTk = config.params?.filterByTk;
  const index = records.findIndex((item) => item.id === filterByTk);
  if (index === -1) {
    return [
      404,
      {
        errors: [
          {
            code: 'NotFound',
            message: 'Record not found',
          },
        ],
      },
    ];
  }
  records[index] = {
    ...records[index],
    ...JSON.parse(config.data),
  };
  return [
    200,
    {
      data: records[index],
    },
  ];
});

mock.onGet('posts:destroy').reply((config) => {
  const filterByTk = config.params?.filterByTk;
  const index = records.findIndex((item) => item.id === filterByTk);
  if (index === -1) {
    return [
      404,
      {
        errors: [
          {
            code: 'NotFound',
            message: 'Record not found',
          },
        ],
      },
    ];
  }
  const deleted = records.splice(index, 1)[0];
  return [
    200,
    {
      data: deleted,
    },
  ];
});

class MultiRecordFlowModel extends FlowModel {
  resource = new MultiRecordResource();

  render() {
    const data = this.resource.getData() || [];
    // 从 state 中获取 meta 信息，这是在 refresh 时设置的
    const responseMeta = this.resource.getDataMeta() || {};
    
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <strong>Resource:</strong> {this.resource.getResourceName()} |
          <strong> Page:</strong> {this.resource.getPage()} |
          <strong> PageSize:</strong> {this.resource.getPageSize()} |
          <strong> Total:</strong> {responseMeta.total || 0}
        </div>
        <pre>{JSON.stringify(data, null, 2)}</pre>
        <Space wrap>
          <Button
            onClick={() => {
              // 重置数据
              records.splice(0, records.length);
              for (let i = 1; i <= 5; i++) {
                records.push({
                  id: i,
                  title: faker.lorem.sentence(),
                  content: faker.lorem.paragraph(),
                });
              }
              this.resource.refresh();
            }}
          >
            Reset
          </Button>
          <Button onClick={() => this.resource.refresh()}>Refresh</Button>
          <Button onClick={() => this.resource.next()}>Next Page</Button>
          <Button onClick={() => this.resource.previous()}>Previous Page</Button>
          <Button onClick={() => this.resource.goto(1)}>Go to Page 1</Button>
          <Button
            onClick={() =>
              this.resource.create({
                title: faker.lorem.sentence(),
                content: faker.lorem.paragraph(),
              })
            }
          >
            Create
          </Button>
          <Button
            onClick={() => {
              const firstItem = data[0];
              if (firstItem) {
                this.resource.update(firstItem.id, {
                  title: faker.lorem.sentence(),
                  content: faker.lorem.paragraph(),
                });
              }
            }}
          >
            Update First
          </Button>
          <Button
            onClick={() => {
              const firstItem = data[0];
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

MultiRecordFlowModel.registerFlow({
  auto: true,
  key: 'setResourceOptions',
  steps: {
    step1: {
      async handler(ctx, params) {
        ctx.model.resource.setAPIClient(api);
        ctx.model.resource.setResourceName('posts');
        ctx.model.resource.setPage(1);
        ctx.model.resource.setPageSize(3);
        await ctx.model.resource.refresh();
      },
    },
  },
});

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
