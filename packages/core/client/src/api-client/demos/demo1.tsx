/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { APIClient, APIClientProvider, compose, useRequest } from '@nocobase/client';
import MockAdapter from 'axios-mock-adapter';
import React from 'react';

const apiClient = new APIClient();

const mock = new MockAdapter(apiClient.axios);

mock.onGet('/users:get').reply(200, {
  data: { id: 1, name: 'John Smith' },
});

const providers = [[APIClientProvider, { apiClient }]];

export default compose(...providers)(() => {
  const { data } = useRequest<{
    data: any;
  }>({
    resource: 'users',
    action: 'get',
    params: {},
  });
  return <div>{data?.data?.name}</div>;
});
