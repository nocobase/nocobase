import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import {
  APIClientProvider,
  CurrentUserProvider,
  Form,
  FormItem,
  Grid,
  Input,
  Application,
  Plugin,
  SchemaComponent,
  SchemaComponentProvider,
} from '@nocobase/client';
import React from 'react';

import { mockAPIClient } from '../../../../testUtils';

const { apiClient, mockRequest } = mockAPIClient();
mockRequest.onGet('/auth:check').reply(() => {
  return [200, { data: {} }];
});

const schema: ISchema = {
  type: 'void',
  name: 'grid1',
  'x-decorator': 'Form',
  'x-component': 'Grid',
  'x-uid': uid(),
  properties: {
    row1: {
      type: 'void',
      'x-component': 'Grid.Row',
      'x-uid': uid(),
      properties: {
        col11: {
          type: 'void',
          'x-component': 'Grid.Col',
          properties: {
            name: {
              type: 'string',
              title: 'Name',
              'x-decorator': 'FormItem',
              'x-component': 'Input',
              'x-collection-field': 'posts.name',
            },
            title: {
              type: 'string',
              title: 'Title',
              'x-decorator': 'FormItem',
              'x-component': 'Input',
              'x-collection-field': 'posts.title',
            },
          },
        },
        col12: {
          type: 'void',
          'x-component': 'Grid.Col',
          properties: {
            intro: {
              type: 'string',
              title: 'Intro',
              'x-decorator': 'FormItem',
              'x-component': 'Input',
            },
          },
        },
      },
    },
  },
};

const Root = () => {
  return (
    <APIClientProvider apiClient={apiClient}>
      <CurrentUserProvider>
        <SchemaComponentProvider components={{ Form, Grid, Input, FormItem }}>
          <SchemaComponent schema={schema} />
        </SchemaComponentProvider>
      </CurrentUserProvider>
    </APIClientProvider>
  );
};

class MyPlugin extends Plugin {
  async load() {
    this.app.router.add('root', {
      path: '/',
      Component: Root,
    });
  }
}

const app = new Application({
  router: {
    type: 'memory',
    initialEntries: ['/'],
  },
  plugins: [MyPlugin],
});

export default app.getRootComponent();
