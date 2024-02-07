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
    test("designable: true & process.env.NODE_ENV === 'development', render `Result` component", () => {
      const NODE_ENV = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      renderApp('test', true);

      process.env.NODE_ENV = NODE_ENV;

      expect(document.body.innerHTML).toContain('ant-result');
    });

    test("designable: false & process.env.NODE_ENV === 'development', render `Result` component", () => {
      const NODE_ENV = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      renderApp('test', false);

      process.env.NODE_ENV = NODE_ENV;

      expect(document.body.innerHTML).toContain('ant-result');
    });

    test("designable: true & process.env.NODE_ENV !== 'development', render `Result` component", () => {
      const NODE_ENV = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      renderApp('test', true);

      process.env.NODE_ENV = NODE_ENV;

      expect(document.body.innerHTML).toContain('ant-result');
    });

    test("designable: false & process.env.NODE_ENV !== 'development', render nothing", () => {
      const NODE_ENV = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      renderApp('test', false);

      process.env.NODE_ENV = NODE_ENV;

      expect(screen.getByTestId('app').innerHTML.length).toBe(0);
    });
  });
});
