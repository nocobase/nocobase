/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render } from '@nocobase/test/client';
import React from 'react';
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
import { SchemaComponent, SchemaComponentProvider } from '../../../schema-component';

const HelloComponent = withDynamicSchemaProps((props: any) => (
  <pre data-testid="component">{JSON.stringify(props)}</pre>
));
const HelloDecorator = withDynamicSchemaProps(({ children, ...others }) => (
  <div>
    <pre data-testid="decorator">{JSON.stringify(others)}</pre>
    {children}
  </div>
));

function withTestDemo(schema: any, scopes?: any) {
  const Demo = () => {
    return (
      <SchemaComponentProvider components={{ HelloComponent, HelloDecorator }} scope={scopes}>
        <SchemaComponent
          schema={{
            type: 'void',
            name: 'hello',
            'x-component': 'HelloComponent',
            'x-decorator': 'HelloDecorator',
            ...schema,
          }}
        />
      </SchemaComponentProvider>
    );
  };

  return Demo;
}

describe('withDynamicSchemaProps', () => {
  test('x-use-component-props', () => {
    function useComponentProps() {
      return {
        a: 'a',
      };
    }
    const schema = {
      'x-use-component-props': 'useComponentProps',
    };
    const scopes = { useComponentProps };

    const Demo = withTestDemo(schema, scopes);
    const { getByTestId } = render(<Demo />);
    expect(getByTestId('component')).toHaveTextContent(JSON.stringify({ a: 'a' }));
  });

  test('x-use-component-props and x-component-props should merge', () => {
    function useComponentProps() {
      return {
        a: 'a',
      };
    }
    const schema = {
      'x-use-component-props': 'useComponentProps',
      'x-component-props': {
        b: 'b',
      },
    };
    const scopes = { useComponentProps };

    const Demo = withTestDemo(schema, scopes);
    const { getByTestId } = render(<Demo />);
    expect(getByTestId('component')).toHaveTextContent(JSON.stringify({ b: 'b', a: 'a' }));
  });

  test('x-use-decorator-props', () => {
    function useDecoratorProps() {
      return {
        a: 'a',
      };
    }
    const schema = {
      'x-use-decorator-props': 'useDecoratorProps',
    };
    const scopes = { useDecoratorProps };

    const Demo = withTestDemo(schema, scopes);
    const { getByTestId } = render(<Demo />);
    expect(getByTestId('decorator')).toHaveTextContent(JSON.stringify({ a: 'a' }));
  });

  test('x-use-decorator-props and x-decorator-props should merge', () => {
    function useDecoratorProps() {
      return {
        a: 'a',
      };
    }
    const schema = {
      'x-use-decorator-props': 'useDecoratorProps',
      'x-decorator-props': {
        b: 'b',
      },
    };
    const scopes = { useDecoratorProps };

    const Demo = withTestDemo(schema, scopes);
    const { getByTestId } = render(<Demo />);
    expect(getByTestId('decorator')).toHaveTextContent(JSON.stringify({ b: 'b', a: 'a' }));
  });

  test('x-use-component-props and x-use-decorator-props exist simultaneously', () => {
    function useDecoratorProps() {
      return {
        a: 'a',
      };
    }
    function useComponentProps() {
      return {
        c: 'c',
      };
    }
    const schema = {
      'x-use-decorator-props': 'useDecoratorProps',
      'x-decorator-props': {
        b: 'b',
      },
      'x-use-component-props': 'useComponentProps',
      'x-component-props': {
        d: 'd',
      },
    };

    const scopes = { useDecoratorProps, useComponentProps };

    const Demo = withTestDemo(schema, scopes);
    const { getByTestId } = render(<Demo />);
    expect(getByTestId('decorator')).toHaveTextContent(JSON.stringify({ b: 'b', a: 'a' }));
    expect(getByTestId('component')).toHaveTextContent(JSON.stringify({ d: 'd', c: 'c' }));
  });

  test('no register scope', () => {
    const schema = {
      'x-use-component-props': 'useComponentProps',
    };
    const Demo = withTestDemo(schema);
    const { getByTestId } = render(<Demo />);
    expect(getByTestId('component')).toHaveTextContent(JSON.stringify({}));
  });

  test('x-use-component-props should override x-component-props', () => {
    function useComponentProps() {
      return {
        a: 'a',
      };
    }
    const schema = {
      'x-use-component-props': 'useComponentProps',
      'x-component-props': {
        a: 'b',
      },
    };
    const scopes = { useComponentProps };

    const Demo = withTestDemo(schema, scopes);
    const { getByTestId } = render(<Demo />);
    expect(getByTestId('component')).toHaveTextContent(JSON.stringify({ a: 'a' }));
  });

  test('x-use-component-props is function', () => {
    const schema = {
      'x-use-component-props': () => ({ a: 'a' }),
    };
    const Demo = withTestDemo(schema);
    const { getByTestId } = render(<Demo />);
    expect(getByTestId('component')).toHaveTextContent(JSON.stringify({ a: 'a' }));
  });

  test('x-use-decorator-props is function', () => {
    const schema = {
      'x-use-decorator-props': () => ({ a: 'a' }),
    };
    const Demo = withTestDemo(schema);
    const { getByTestId } = render(<Demo />);
    expect(getByTestId('decorator')).toHaveTextContent(JSON.stringify({ a: 'a' }));
  });

  test('x-use-component-props with dot', () => {
    function useComponentProps() {
      return {
        a: 'a',
      };
    }
    const schema = {
      'x-use-component-props': 'cm.useComponentProps',
    };

    const scopes = { cm: { useComponentProps } };

    const Demo = withTestDemo(schema, scopes);
    const { getByTestId } = render(<Demo />);
    expect(getByTestId('component')).toHaveTextContent(JSON.stringify({ a: 'a' }));
  });

  test('x-use-decorator-props with dot', () => {
    function useDecoratorProps() {
      return {
        b: 'b',
      };
    }
    const schema = {
      'x-use-decorator-props': 'cm.useDecoratorProps',
    };

    const scopes = { cm: { useDecoratorProps } };

    const Demo = withTestDemo(schema, scopes);
    const { getByTestId } = render(<Demo />);
    expect(getByTestId('decorator')).toHaveTextContent(JSON.stringify({ b: 'b' }));
  });

  test('override scope', () => {
    function useDecoratorProps() {
      return {
        b: 'b',
      };
    }
    function useDecoratorProps2() {
      return {
        c: 'c',
      };
    }
    const schema = {
      'x-use-decorator-props': 'cm.useDecoratorProps',
    };
    const scopes = { cm: { useDecoratorProps } };
    const Demo = function () {
      return (
        <SchemaComponentProvider components={{ HelloComponent, HelloDecorator }} scope={scopes}>
          <SchemaComponent
            scope={{
              cm: { useDecoratorProps: useDecoratorProps2 },
            }}
            schema={{
              type: 'void',
              name: 'hello',
              'x-component': 'HelloComponent',
              'x-decorator': 'HelloDecorator',
              ...schema,
            }}
          />
        </SchemaComponentProvider>
      );
    };
    const { getByTestId } = render(<Demo />);
    expect(getByTestId('decorator')).toHaveTextContent(JSON.stringify({ c: 'c' }));
  });
});
