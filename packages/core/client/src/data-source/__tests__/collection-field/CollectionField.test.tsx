import React from 'react';
import { render, screen } from '@nocobase/test/client';
import {
  CollectionFieldV2,
  CollectionProviderV2,
  Application,
  FormItem,
  Input,
  SchemaComponent,
  SchemaComponentProvider,
  DataSourceApplicationProvider,
} from '@nocobase/client';
import collections from '../collections.json';

function renderApp() {
  const app = new Application({
    dataSourceManager: {
      collections: collections as any,
    },
  });

  const schema = {
    name: 'root',
    type: 'object',
    properties: {
      nickname: {
        'x-component': 'CollectionField',
        'x-decorator': 'FormItem',
      },
    },
  };

  return render(
    <div data-testid="app">
      <SchemaComponentProvider designable={true}>
        <DataSourceApplicationProvider dataSourceManager={app.dataSourceManager}>
          <CollectionProviderV2 name="users">
            <SchemaComponent schema={schema} components={{ CollectionField: CollectionFieldV2, FormItem, Input }} />
          </CollectionProviderV2>
        </DataSourceApplicationProvider>
      </SchemaComponentProvider>
    </div>,
  );
}

describe('CollectionField', () => {
  it('works', async () => {
    renderApp();
    expect(screen.getByText('Nickname')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveClass('ant-input');
  });
});
