import { faker } from '@faker-js/faker';
import MockAdapter from 'axios-mock-adapter';
import { APIClient } from '@nocobase/sdk';

export const api = new APIClient({
  baseURL: 'https://localhost:8000/api',
});

const mock = new MockAdapter(api.axios);

const records = Array.from({ length: 30 }).map((_, i) => ({
  id: i + 1,
  username: faker.internet.userName(),
}));

mock.onGet('users:list').reply((config) => {
  const page = parseInt(config.params?.page) || 1;
  const pageSize = parseInt(config.params?.pageSize) || 10;
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
