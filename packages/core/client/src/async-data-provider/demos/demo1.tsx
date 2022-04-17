import React, { createContext, useContext } from 'react';
import MockAdapter from 'axios-mock-adapter';
import { APIClient, APIClientProvider, compose, AsyncDataProvider, useAsyncData } from '@nocobase/client';

const apiClient = new APIClient();

const mock = new MockAdapter(apiClient.axios);

mock.onGet('/users/1').reply(200, {
  data: { id: 1, name: 'John Smith' },
});

const providers = [
  [APIClientProvider, { apiClient }],
  [AsyncDataProvider, { request: { url: '/users/1' } }],
];

export default compose(...providers)(() => {
  const { data } = useAsyncData();
  console.log(data);
  return <div>{data?.data?.name}</div>;
});
