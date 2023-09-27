import {
  APIClient,
  APIClientProvider,
  CardItem,
  G2Plot,
  SchemaComponent,
  SchemaComponentProvider,
} from '@nocobase/client';
import React from 'react';
import { mockAPIClient } from '../../../../testUtils';

const { apiClient, mockRequest } = mockAPIClient();

mockRequest.onGet('/test').reply(200, {
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

const requestChartData = (options) => {
  return async function (this: { api: APIClient }) {
    const response = await this.api.request(options);
    return response?.data?.data;
  };
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
      data: '{{ requestChartData({ url: "/test" }) }}',
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
    <APIClientProvider apiClient={apiClient}>
      <SchemaComponentProvider components={{ G2Plot, CardItem }} scope={{ requestChartData }}>
        <SchemaComponent schema={schema} />
      </SchemaComponentProvider>
    </APIClientProvider>
  );
};
