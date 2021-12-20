/**
 * title: Action.Drawer
 */
import React, { createContext, useContext, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, Drawer } from 'antd';
import { SchemaComponentProvider, SchemaComponent } from '@nocobase/client';
import { observer, RecursionField, useField, useFieldSchema, ISchema } from '@formily/react';

export const VisibleContext = createContext(null);

const useA = () => {
  return {
    async run() {},
  };
};

export function useCloseAction() {
  const [, setVisible] = useContext(VisibleContext);
  return {
    async run() {
      setVisible(false);
    },
  };
}

export const Action: any = observer((props: any) => {
  const { useAction = useA, onClick, ...others } = props;
  const [visible, setVisible] = useState(false);
  const schema = useFieldSchema();
  const field = useField();
  const { run } = useAction();
  return (
    <VisibleContext.Provider value={[visible, setVisible]}>
      <Button
        {...others}
        onClick={() => {
          onClick && onClick();
          setVisible(true);
          run();
        }}
      >
        {schema.title}
      </Button>
      <RecursionField basePath={field.address} schema={schema} onlyRenderProperties />
    </VisibleContext.Provider>
  );
});

Action.Drawer = observer((props: any) => {
  const [visible, setVisible] = useContext(VisibleContext);
  const schema = useFieldSchema();
  const field = useField();
  return (
    <>
      {createPortal(
        <Drawer
          title={schema.title}
          visible={visible}
          onClose={() => setVisible(false)}
          footer={
            <RecursionField
              basePath={field.address}
              schema={schema}
              onlyRenderProperties
              filterProperties={(s) => {
                return s['x-component'] === 'Action.Drawer.Footer';
              }}
            />
          }
        >
          <RecursionField
            basePath={field.address}
            schema={schema}
            onlyRenderProperties
            filterProperties={(s) => {
              return s['x-component'] !== 'Action.Drawer.Footer';
            }}
          />
        </Drawer>,
        document.body,
      )}
    </>
  );
});

Action.Drawer.Footer = observer((props: any) => {
  const field = useField();
  const schema = useFieldSchema();
  return <RecursionField basePath={field.address} schema={schema} onlyRenderProperties />;
});

const schema: ISchema = {
  type: 'object',
  properties: {
    a1: {
      'x-component': 'Action',
      'x-component-props': {
        type: 'primary',
      },
      title: 'Open',
      properties: {
        d1: {
          'x-component': 'Action.Drawer',
          title: 'Drawer Title',
          properties: {
            c1: {
              'x-content': 'Hello',
            },
            f1: {
              'x-component': 'Action.Drawer.Footer',
              properties: {
                a1: {
                  'x-component': 'Action',
                  title: 'Close',
                  'x-component-props': {
                    useAction: '{{ useCloseAction }}',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

export default function App() {
  return (
    <SchemaComponentProvider components={{ Action }} scope={{ useCloseAction }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
}
