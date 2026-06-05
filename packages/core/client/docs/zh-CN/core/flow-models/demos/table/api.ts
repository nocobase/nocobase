import { faker } from '@faker-js/faker';
import MockAdapter from 'axios-mock-adapter';

import { APIClient } from '@nocobase/sdk';

export const api = new APIClient({
  baseURL: 'https://localhost:8000/api',
});

const mock = new MockAdapter(api.axios);

const records = Array.from({ length: 50 }).map((_, i) => ({
  id: i + 1,
  username: faker.internet.userName(),
  nickname: faker.person.firstName(),
}));

mock.onGet('users:list').reply((config) => {
  const page = parseInt(config.params?.page) || 1;
  const pageSize = parseInt(config.params?.pageSize) || 3;
  const start = (page - 1) * pageSize;
  const items = records.slice(start, start + pageSize);

  return [
    200,
    {
      data: items,
      meta: { page, pageSize, count: records.length },
    },
  ];
});

mock.onPost('users:create').reply((config) => {
  const newItem = {
    ...JSON.parse(config.data),
    id: Math.max(...records.map((r) => r.id)) + 1,
  };
  records.push(newItem);
  return [
    200,
    {
      data: newItem,
    },
  ];
});

mock.onGet('users:get').reply((config) => {
  const filterByTk = config.params?.filterByTk;
  const record = records.find((item) => item.id === filterByTk);
  return [
    200,
    {
      data: record,
    },
  ];
});

mock.onPost('users:update').reply((config) => {
  console.log('users:update', config);
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

mock.onGet('users:destroy').reply((config) => {
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
