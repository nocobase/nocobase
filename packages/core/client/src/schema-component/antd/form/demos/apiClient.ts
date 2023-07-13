import { APIClient } from '@nocobase/client';
import MockAdapter from 'axios-mock-adapter';

export const apiClient = new APIClient();

const mock = new MockAdapter(apiClient.axios);

const sleep = (value: number) => new Promise((resolve) => setTimeout(resolve, value));

mock.onGet('/posts:get').reply(async (config) => {
  await sleep(500);
  return [
    200,
    {
      data: {
        field1: 'uid',
      },
    },
  ];
});
