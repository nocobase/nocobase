import { APIClient, APIClientProvider, G2Plot, SchemaComponent, SchemaComponentProvider } from '@nocobase/client';
import MockAdapter from 'axios-mock-adapter';
import React from 'react';

const api = new APIClient();

const mock = new MockAdapter(api.axios);

mock.onGet('/test').reply(200, {
  data: [
    {
      Date: '2010-01',
      scales: 1998,
    },
    {
      Date: '2010-02',
      scales: 1850,
    },
    {
      Date: '2010-03',
      scales: 1720,
    },
    {
      Date: '2010-04',
      scales: 1818,
    },
    {
      Date: '2010-05',
      scales: 1920,
    },
    {
      Date: '2010-06',
      scales: 1802,
    },
    {
      Date: '2010-07',
      scales: 1945,
    },
    {
      Date: '2010-08',
      scales: 1856,
    },
    {
      Date: '2010-09',
      scales: 2107,
    },
  ],
});

const fetchData = async (api: APIClient, options) => {
  const response = await api.request(options);
  return response?.data?.data;
};

const schema = {
  type: 'void',
  name: 'line',
  'x-designer': 'G2Plot.Designer',
  'x-decorator': 'CardItem',
  'x-component': 'G2Plot',
  'x-component-props': {
    plot: 'Line',
    config: {
      data: '{{ fetchData(api, { url: "/test" }) }}',
      padding: 'auto',
      xField: 'Date',
      yField: 'scales',
      xAxis: {
        // type: 'timeCat',
        tickCount: 5,
      },
    },
  },
};

export default () => {
  return (
    <APIClientProvider apiClient={api}>
      <SchemaComponentProvider>
        <SchemaComponent schema={schema} components={{ G2Plot }} scope={{ api, fetchData }} />
      </SchemaComponentProvider>
    </APIClientProvider>
  );
};
