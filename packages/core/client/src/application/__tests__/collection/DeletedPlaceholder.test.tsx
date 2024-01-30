import React from 'react';

import { render, screen } from '@nocobase/test/client';
import { DeletedPlaceholder } from '../../collection/DeletedPlaceholder';
import { SchemaComponentProvider } from '../../../schema-component';

function renderApp(name?: any, designable?: boolean) {
  render(
    <div data-testid="app">
      <SchemaComponentProvider designable={designable}>
        <DeletedPlaceholder type="test" name={name}></DeletedPlaceholder>
      </SchemaComponentProvider>
    </div>,
  );
}

describe('DeletedPlaceholder', () => {
  test('name is undefined, render nothing', () => {
    renderApp();

    expect(screen.getByTestId('app').innerHTML.length).toBe(0);
  });

  describe('name exist', () => {
    test("designable: true & process.env.NODE_ENV === 'development', render `Result` component", () => {
      const NODE_ENV = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      renderApp('test', true);

      process.env.NODE_ENV = NODE_ENV;

      expect(screen.getByTestId('app').innerHTML).toContain('ant-result');
    });

    test("designable: false & process.env.NODE_ENV === 'development', render `Result` component", () => {
      const NODE_ENV = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      renderApp('test', false);

      process.env.NODE_ENV = NODE_ENV;

      expect(screen.getByTestId('app').innerHTML).toContain('ant-result');
    });

    test("designable: true & process.env.NODE_ENV !== 'development', render `Result` component", () => {
      const NODE_ENV = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      renderApp('test', true);

      process.env.NODE_ENV = NODE_ENV;

      expect(screen.getByTestId('app').innerHTML).toContain('ant-result');
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
