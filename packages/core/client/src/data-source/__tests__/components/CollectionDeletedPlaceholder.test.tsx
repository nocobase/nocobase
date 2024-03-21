import React from 'react';

import { render, screen } from '@nocobase/test/client';
import { CollectionDeletedPlaceholder, SchemaComponent, SchemaComponentProvider } from '@nocobase/client';

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
      <SchemaComponentProvider designable={designable}>
        <SchemaComponent schema={schema} components={{ CollectionDeletedPlaceholder }} />
      </SchemaComponentProvider>
    </div>,
  );
}

describe('CollectionDeletedPlaceholder', () => {
  test('name is undefined, render `Result` component', () => {
    renderApp(undefined, true);

    expect(document.body.innerHTML).toContain('ant-result');
  });

  describe('name exist', () => {
    test('designable: true, render `Result` component', () => {
      renderApp('test', true);

      expect(document.body.innerHTML).toContain('ant-result');
    });

    test('designable: false, render nothing', () => {
      renderApp('test', false);

      expect(screen.getByTestId('app').innerHTML.length).toBe(0);
    });
  });
});
