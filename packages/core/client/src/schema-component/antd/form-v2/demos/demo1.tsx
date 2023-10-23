import { ISchema, useForm } from '@formily/react';
import {
  APIClientProvider,
  Action,
  CollectionField,
  CollectionManagerProvider,
  CurrentUserProvider,
  FormBlockProvider,
  FormItem,
  FormV2,
  Input,
  SchemaComponent,
  SchemaComponentProvider,
  useFormBlockContext,
} from '@nocobase/client';
import { notification } from 'antd';
import React from 'react';
import { useFilterByTk } from '../../../../block-provider/BlockProvider';
import { mockAPIClient } from '../../../../testUtils';
import collections from './collections';

const { apiClient, mockRequest } = mockAPIClient();

mockRequest.onPost('/users:update').reply((params) => {
  notification.success({
    message: params.data,
  });
  return [200, JSON.parse(params.data)];
});
mockRequest.onGet('/auth:check').reply(() => {
  return [200, { data: {} }];
});

function useAction() {
  const ctx = useFormBlockContext();
  const form = useForm();
  const filterByTk = useFilterByTk();
  return {
    async run() {
      console.log('form.values', form.values);
      await ctx.resource.update({
        filterByTk,
        values: form.values,
      });
    },
  };
}

const schema: ISchema = {
  type: 'object',
  properties: {
    block: {
      type: 'void',
      'x-decorator': 'FormBlockProvider',
      'x-decorator-props': {
        collection: 'users',
        resource: 'users',
      },
      properties: {
        form: {
          type: 'void',
          'x-component': 'FormV2',
          'x-component-props': {},
          properties: {
            nickname: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'CollectionField',
            },
            button: {
              title: 'Submit',
              'x-component': 'Action',
              'x-component-props': {
                htmlType: 'submit',
                type: 'primary',
                useAction,
              },
            },
          },
        },
      },
    },
  },
};

export default () => {
  return (
    <APIClientProvider apiClient={apiClient}>
      <CurrentUserProvider>
        <CollectionManagerProvider collections={collections}>
          <SchemaComponentProvider components={{ FormBlockProvider, FormV2, FormItem, CollectionField, Action, Input }}>
            <SchemaComponent schema={schema} />
          </SchemaComponentProvider>
        </CollectionManagerProvider>
      </CurrentUserProvider>
    </APIClientProvider>
  );
};
