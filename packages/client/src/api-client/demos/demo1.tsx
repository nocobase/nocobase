import React from 'react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { useRequest, APIClient, APIClientProvider } from '@nocobase/client';

const instance = axios.create({
  baseURL: 'http://localhost/api/',
});

const api = new APIClient(instance);

const mock = new MockAdapter(instance);

mock.onGet('/users').reply(200, {
  users: [{ id: 1, name: 'John Smith' }],
});

mock.onGet('/users:get').reply(200, {
  data: { id: 1, name: 'John Smith' },
});

function Hello() {
  const { data } = useRequest({
    resource: 'users',
    action: 'get',
    params: {},
  });
  return <div>{data?.name}</div>;
}

export default () => {
  return (
    <APIClientProvider apiClient={api}>
      <Hello />
    </APIClientProvider>
  );
};
