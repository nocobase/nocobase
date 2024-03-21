import {
  APIClientProvider,
  CurrentUserProvider,
  FormItem,
  FormProvider,
  Input,
  SchemaComponent,
} from '@nocobase/client';
import React from 'react';
import { mockAPIClient } from '../../../../testUtils';

const { apiClient, mockRequest } = mockAPIClient();
mockRequest.onGet('/auth:check').reply(() => {
  return [200, { data: {} }];
});

const schema = {
  type: 'object',
  properties: {
    input: {
      type: 'string',
      title: 'title',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
  },
};

export default () => {
  return (
    <APIClientProvider apiClient={apiClient}>
      <CurrentUserProvider>
        <FormProvider>
          <SchemaComponent components={{ FormItem, Input }} schema={schema} />
        </FormProvider>
      </CurrentUserProvider>
    </APIClientProvider>
  );
};
