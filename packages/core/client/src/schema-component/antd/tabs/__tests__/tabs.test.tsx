/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen, waitFor } from '@nocobase/test/client';
import React from 'react';
import { ISchema } from '@formily/react';
import {
  AntdSchemaComponentProvider,
  Application,
  SchemaComponent,
  SchemaComponentProvider,
  Tabs,
} from '@nocobase/client';

const schema: ISchema = {
  type: 'object',
  properties: {
    tabs1: {
      type: 'void',
      'x-component': 'Tabs',
      properties: {
        tab1: {
          type: 'void',
          title: 'Tab1',
          'x-component': 'Tabs.TabPane',
          'x-component-props': {
            tab: 'Tab1',
          },
          properties: {
            aaa: {
              'x-content': 'Hello1',
            },
          },
        },
        tab2: {
          type: 'void',
          title: 'Tab2',
          'x-component': 'Tabs.TabPane',
          'x-component-props': {
            tab: 'Tab2',
          },
          properties: {
            bbb: {
              'x-content': 'Hello2',
            },
          },
        },
      },
    },
  },
};

const Root = () => {
  return (
    <SchemaComponentProvider components={{ Tabs }}>
      <AntdSchemaComponentProvider>
        <SchemaComponent schema={schema} />
      </AntdSchemaComponentProvider>
    </SchemaComponentProvider>
  );
};

const app = new Application({
  router: {
    type: 'memory',
    initialEntries: ['/'],
  },
  providers: [Root],
});

const App = app.getRootComponent();

describe('Tabs', () => {
  it('basic', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Hello1')).toBeInTheDocument();
    });

    await screen.getByRole('tab', { name: 'Tab2' }).click();

    await waitFor(() => {
      expect(screen.getByText('Hello2')).toBeInTheDocument();
    });
  });
});
