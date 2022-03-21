import { ISchema } from '@formily/react';
import {
  ActionLog,
  ActionLogProvider,
  AntdSchemaComponentProvider,
  APIClient,
  APIClientProvider,
  CollectionManagerProvider,
  SchemaComponent,
  SchemaComponentProvider,
  SchemaInitializerProvider,
} from '@nocobase/client';
import MockAdapter from 'axios-mock-adapter';
import React from 'react';
import { mockData } from './mockData';

const apiClient = new APIClient();

const mock = new MockAdapter(apiClient.axios);

mock.onGet('/action_logs:list').reply(200, mockData);

const schema = {
  type: 'void',
  name: 'ActionLog',
  'x-component': 'ActionLog',
};

const collections = [
  {
    name: 'action_logs',
    fields: [
      {
        type: 'integer',
        name: 'id',
        interface: 'input',
        uiSchema: {
          title: 'ID',
          type: 'number',
          'x-component': 'InputNumber',
          required: true,
          description: 'description1',
        } as ISchema,
      },
      {
        type: 'string',
        name: 'created_at',
        interface: 'createdAt',
        uiSchema: {
          title: 'Created At',
          type: 'number',
          'x-component': 'DatePicker',
          required: true,
          description: 'Date Picker',
        } as ISchema,
      },
      {
        type: 'string',
        name: 'collection_name',
        interface: 'input',
        uiSchema: {
          title: 'collection name',
          type: 'number',
          'x-component': 'Input',
          description: 'collection name',
        } as ISchema,
      },
    ],
  },
];

export default () => {
  return (
    <APIClientProvider apiClient={apiClient}>
      <SchemaInitializerProvider>
        <SchemaComponentProvider components={{ ActionLog }}>
          <AntdSchemaComponentProvider>
            <CollectionManagerProvider collections={collections}>
              <ActionLogProvider>
                <SchemaComponent schema={schema} />
              </ActionLogProvider>
            </CollectionManagerProvider>
          </AntdSchemaComponentProvider>
        </SchemaComponentProvider>
      </SchemaInitializerProvider>
    </APIClientProvider>
  );
};
