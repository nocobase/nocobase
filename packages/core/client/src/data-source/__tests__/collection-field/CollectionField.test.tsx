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

function renderApp(fieldName: string) {
  const noUiSchema = {
    key: 'no-ui-schema',
    name: 'no-ui-schema',
    type: 'string',
    interface: 'select',
    description: null,
    collectionName: 't_vwpds9fs4xs',
    parentKey: null,
    reverseKey: null,
  };

  const usersCollection: any = collections[0];
  usersCollection.fields.push(noUiSchema);

  const app = new Application({
    dataSourceManager: {
      collections: [usersCollection],
    },
  });

  const schema = {
    name: 'root',
    type: 'object',
    properties: {
      [fieldName]: {
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
  it('works', () => {
    renderApp('nickname');
    expect(screen.getByText('Nickname')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveClass('ant-input');
  });

  it('no schema', () => {
    renderApp('no-ui-schema');
    expect(document.querySelector('.ant-formily-item-control-content-component')).toHaveTextContent('');
  });
});
