import React from 'react';

import { render, screen, userEvent, waitFor } from '@nocobase/test/client';
import { CollectionDeletedPlaceholder, SchemaComponent, SchemaComponentProvider } from '@nocobase/client';
import { App } from 'antd';

function renderApp(name?: any, designable?: boolean) {
  const schema = {
    name: 'root',
    type: 'void',
    'x-component': 'CollectionDeletedPlaceholder',
    'x-component-props': {
      name,
      type: 'Collection',
    },
  };

  render(
    <div data-testid="app">
      <App>
        <SchemaComponentProvider designable={designable}>
          <SchemaComponent schema={schema} components={{ CollectionDeletedPlaceholder }} />
        </SchemaComponentProvider>
      </App>
    </div>,
  );
}

describe('CollectionDeletedPlaceholder', () => {
  test('name is undefined, render `Result` component', async () => {
    renderApp(undefined, true);

    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Collection name is required')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(screen.queryByText('Are you sure you want to delete it?')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('OK'));

    await waitFor(() => {
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });
  });

  test.only('designable: true, render `Result` component', () => {
    renderApp('test', true);
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(
      screen.getByText('The collection "test" may have been deleted. Please remove this block.'),
    ).toBeInTheDocument();
  });

  test('designable: false, render nothing', () => {
    renderApp('test', false);

    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });
});
