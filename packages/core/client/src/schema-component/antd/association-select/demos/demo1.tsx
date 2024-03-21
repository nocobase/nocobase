import { APIClientProvider, AssociationSelect, FormProvider, SchemaComponent } from '@nocobase/client';
import React from 'react';
import { mockAPIClient } from '../../../../testUtils';

const { apiClient, mockRequest } = mockAPIClient();
mockRequest.onGet('/posts:list').reply(() => {
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

// 写一个简单的 schema
const schema = {
  type: 'object',
  properties: {
    association: {
      type: 'array',
      'x-component': 'AssociationSelect',
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
        <SchemaComponent components={{ AssociationSelect }} schema={schema} />
      </APIClientProvider>
    </FormProvider>
  );
};
