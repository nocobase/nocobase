import { uid } from '@formily/shared';
import { APIClient } from '@nocobase/client';
import MockAdapter from 'axios-mock-adapter';
import _ from 'lodash';

export const apiClient = new APIClient();

const mock = new MockAdapter(apiClient.axios);

const sleep = (value: number) => new Promise((resolve) => setTimeout(resolve, value));

mock.onGet('/posts:list').reply(async (config) => {
  // const [{ pageSize }] = config.params;
  const pageSize = config.params.pageSize || 10;
  const page = config.params.page || 1;
  console.log(pageSize, page, config.params);
  await sleep(1000);
  return [
    200,
    {
      data: _.range(pageSize).map((v) => {
        return {
          id: v + (page - 1) * pageSize,
          name: uid(),
        };
      }),
      meta: {
        count: 100,
        pageSize,
        page,
      },
    },
  ];
});

