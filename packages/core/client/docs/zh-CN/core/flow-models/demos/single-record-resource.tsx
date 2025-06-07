import { faker } from '@faker-js/faker';
import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer, SingleRecordResource } from '@nocobase/flow-engine';
import { Button, Space } from 'antd';
import MockAdapter from 'axios-mock-adapter';
import React from 'react';

import { observable } from '@formily/reactive';
import { APIClient } from '@nocobase/sdk';

const api = new APIClient({
  baseURL: 'https://localhost:8000/api',
});

const mock = new MockAdapter(api.axios);

const records = [
  {
    id: 1,
    name: faker.person.fullName(),
    email: faker.internet.email(),
  },
];

mock.onGet('users:get').reply((config) => {
  return [
    200,
    {
      data: records[0] || null,
    },
  ];
});

mock.onPost('users:update').reply((config) => {
  if (records.length === 0) {
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
  records[0] = {
    ...records[0],
    ...JSON.parse(config.data),
  };
  return [
    200,
    {
      data: records[0],
    },
  ];
});

mock.onGet('users:destroy').reply((config) => {
  records.splice(0, 1); // 删除第一个记录
  return [
    200,
    {
      data: 1,
    },
  ];
});

// class DataBlockFlowModel extends FlowModel {
//   resource;
//   constructor(options) {
//     super(options);
//     this.resource = new SingleRecordResource();
//     this.resource.setAPIClient(this.flowEngine.apiClient);
//   }
// }

class SingleRecordFlowModel extends FlowModel {
  meta = observable.shallow({
    resource: null,
  });

  get resource(): SingleRecordResource {
    return this.meta.resource;
  }

  set resource(value) {
    this.meta.resource = value;
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
          <Button
            onClick={() => {
              records[0] = {
                id: 1,
                name: faker.person.fullName(),
                email: faker.internet.email(),
              };
              this.resource.refresh();
            }}
          >
            Reset
          </Button>
          <Button onClick={() => this.resource.refresh()}>Refresh</Button>
          <Button
            onClick={() =>
              this.resource.save({
                name: faker.person.fullName(),
                email: faker.internet.email(),
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

SingleRecordFlowModel.registerFlow<SingleRecordFlowModel>({
  auto: true,
  key: 'default',
  steps: {
    step1: {
      async handler(ctx, params) {
        ctx.model.resource = new SingleRecordResource(api as any, {
          resourceName: 'users',
          filterByTk: 1,
        });
        await ctx.model.resource.refresh();
      },
    },
  },
});

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
