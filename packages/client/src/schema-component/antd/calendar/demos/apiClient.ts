import { uid } from '@formily/shared';
import { APIClient } from '@nocobase/client';
import MockAdapter from 'axios-mock-adapter';
import _ from 'lodash';

export const apiClient = new APIClient();

const mock = new MockAdapter(apiClient.axios);

const sleep = (value: number) => new Promise((resolve) => setTimeout(resolve, value));

mock.onGet('/tasks:list').reply(async (config) => {
  // const [{ pageSize }] = config.params;
  const pageSize = config.params.pageSize || 10;
  const page = config.params.page || 1;
  console.log(pageSize, page, config.params);
  await sleep(1000);
  return [
    200,
    {
      data: _.range(pageSize).map((v) => {
        const month = Math.floor(Math.random() * 10 + 1);
        const startDate = Math.floor(Math.random() * 20 + 1);
        const endDate = startDate + Math.floor(Math.random() * 2 + 1);
        return {
          id: v + (page - 1) * pageSize,
          title: uid(),
          start: new Date(2022, month, startDate),
          end: new Date(2022, month, endDate),
        };
      }),
    },
  ];
});
