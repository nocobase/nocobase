import React from 'react';
import { fireEvent, render, screen, waitFor } from '@nocobase/test/client';
import { SchemaToolbarProvider, useSchemaToolbar, useSchemaToolbarRender } from '../schema-toolbar';
import { SchemaComponent, SchemaComponentProvider, SortableContext, SortableProvider } from '../../schema-component';
import { useFieldSchema } from '@formily/react';
import { Application, ApplicationContext } from '@nocobase/client';

describe('SchemaToolbar', () => {
  test('SchemaToolbarProvider & useSchemaToolbar', () => {
    const Demo = () => {
      const context = useSchemaToolbar();
      return <div data-testid="content">{context.test}</div>;
    };

    const Root = () => {
      return (
        <SchemaToolbarProvider test={'123'}>
          <Demo></Demo>
        </SchemaToolbarProvider>
      );
    };

    render(<Root />);

    expect(screen.getByTestId('content')).toHaveTextContent('123');
  });

  describe('useSchemaToolbarRender()', () => {
    const renderApp = (demoSchema: any, designable = true) => {
      const Demo = () => <div data-testid="demo">Demo</div>;

      const CustomToolbar = (props) => {
        return (
          <>
            <div data-testid="custom-toolbar">CustomToolbar</div>
            <div data-testid="custom-toolbar-props">{JSON.stringify(props)}</div>
          </>
        );
      };

      const schema = {
        name: 'root',
        type: 'object',
        'x-decorator': 'Wrapper',
        'x-component': 'Demo',
        ...demoSchema,
      };

      const Wrapper = ({ children }) => {
        const schema = useFieldSchema();
        const context = useSchemaToolbarRender(schema);
        return (
          <>
            <div data-testid="toolbar">{context.render({ customProps: '123' })}</div>
            <div data-testid="toolbar-exists">{JSON.stringify(context.exists)}</div>
            {children}
          </>
        );
      };

      const app = new Application({});

      render(
        <ApplicationContext.Provider value={app}>
          <SortableProvider>
            <SchemaComponentProvider designable={designable}>
              <SchemaComponent schema={schema} components={{ Demo, Wrapper, CustomToolbar }} />
            </SchemaComponentProvider>
          </SortableProvider>
        </ApplicationContext.Provider>,
      );
    };

    test('Render x-designer if x-designer has a value', () => {
      renderApp({
        'x-designer': 'CustomToolbar',
      });

      expect(screen.getByTestId('custom-toolbar')).toHaveTextContent('CustomToolbar');
      expect(screen.getByTestId('custom-toolbar-props')).toHaveTextContent('{"customProps":"123"}');
      expect(screen.getByTestId('toolbar-exists')).toHaveTextContent('true');
    });

    test('Render x-toolbar if it has a value', () => {
      renderApp({
        'x-toolbar': 'CustomToolbar',
      });

      expect(screen.getByTestId('custom-toolbar')).toHaveTextContent('CustomToolbar');
    });

    test('Render x-toolbar if both x-toolbar and x-designer have values', () => {
      renderApp({
        'x-toolbar': 'CustomToolbar',
        'x-designer': 'CustomToolbar',
      });

      expect(screen.getByTestId('custom-toolbar')).toHaveTextContent('CustomToolbar');
    });

    test('Render the default SchemaToolbar component if x-toolbar and x-designer have no values and x-settings has a value', () => {
      renderApp({
        'x-settings': 'DemoSettings',
      });

      expect(screen.getByTestId('toolbar').innerHTML.length > 0).toBe(true);
      expect(screen.getByTestId('toolbar-exists')).toHaveTextContent('true');
    });

    test('Do not render if x-toolbar and x-designer have no values and x-settings also has no value', () => {
      renderApp({});

      expect(screen.getByTestId('toolbar')).toHaveTextContent('');
      expect(screen.getByTestId('toolbar-exists')).toHaveTextContent('false');
    });

    test('Do not render if the component corresponding to x-toolbar cannot be found', () => {
      renderApp({
        'x-toolbar': 'NotFound',
      });

      expect(screen.getByTestId('toolbar')).toHaveTextContent('');
    });

    test('Do not render if designable is false', () => {
      renderApp(
        {
          'x-designer': 'CustomToolbar',
        },
        false,
      );

      expect(screen.getByTestId('toolbar')).toHaveTextContent('');
    });

    test('x-toolbar-props and custom Props', () => {
      renderApp({
        'x-toolbar': 'CustomToolbar',
        'x-toolbar-props': {
          test: '123',
        },
      });

      expect(screen.getByTestId('custom-toolbar-props')).toHaveTextContent('{"test":"123","customProps":"123"}');
    });
  });
});
