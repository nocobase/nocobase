

import { APIClientProvider, FormProvider, RemoteSelect, SchemaComponent } from '@nocobase/client';
import React from 'react';
import { mockAPIClient } from '../../../../testUtils';
import { sleep } from '@nocobase/test/web';

const { apiClient, mockRequest } = mockAPIClient();
mockRequest.onGet('/posts:list').reply(async () => {
  await sleep(100);
  return [
    200,
    {
      data: [
        {
          id: 1,
          title: 'title1',
        },
        {
          id: 2,
          title: 'title2',
        },
      ],
    },
  ];
});

const schema = {
  type: 'object',
  properties: {
    association: {
      type: 'array',
      'x-component': 'RemoteSelect',
      'x-component-props': {
        multiple: true,
        fieldNames: {
          label: 'title',
          value: 'id',
        },
        service: {
          resource: 'posts',
          action: 'list',
        },
        style: {
          width: '100%',
        },
      },
    },
  },
};

export default () => {
  return (
    <FormProvider>
      <APIClientProvider apiClient={apiClient}>
        <SchemaComponent components={{ RemoteSelect }} schema={schema} />
      </APIClientProvider>
    </FormProvider>
  );
};
