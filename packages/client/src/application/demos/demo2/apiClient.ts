import { APIClient } from '@nocobase/client';
import MockAdapter from 'axios-mock-adapter';

const apiClient = new APIClient({
  baseURL: `${location.protocol}//${location.host}/api/`,
});

const mock = new MockAdapter(apiClient.axios);

mock.onGet('/app:getLang').reply(200, {
  data: { lang: 'en-US' },
});

mock.onGet('/routes:getAccessible').reply(200, {
  data: [
    {
      type: 'redirect',
      from: '/',
      to: '/admin',
      exact: true,
    },
    {
      type: 'route',
      uiSchemaKey: 'qqzzjakwkwl',
      path: '/admin/:name(.+)?',
      component: 'AdminLayout',
      title: 'NocoBase',
    },
    {
      type: 'route',
      component: 'AuthLayout',
      routes: [
        {
          type: 'route',
          uiSchemaKey: 'dtf9j0b8p9u',
          path: '/signin',
          component: 'RouteSchemaComponent',
          title: '{{t("Sign in")}}',
        },
      ],
    },
  ],
});

export default apiClient;
