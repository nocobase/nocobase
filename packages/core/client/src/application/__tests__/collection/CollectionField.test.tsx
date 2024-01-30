import React from 'react';
import { render, screen } from '@nocobase/test/client';
import { CollectionFieldV2, CollectionManagerProviderV2, CollectionProviderV2 } from '../../collection';
import { Application } from '../../Application';
import collections from './collections.json';
import { FormItem, Input, SchemaComponent, SchemaComponentProvider } from '../../../schema-component';

function renderApp() {
  const app = new Application({
    collectionManager: {
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
        <CollectionManagerProviderV2 collectionManager={app.collectionManager}>
          <CollectionProviderV2 name="users">
            <SchemaComponent schema={schema} components={{ CollectionField: CollectionFieldV2, FormItem, Input }} />
          </CollectionProviderV2>
        </CollectionManagerProviderV2>
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
