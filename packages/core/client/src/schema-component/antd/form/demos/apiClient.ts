/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
