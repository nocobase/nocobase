import React, { createContext, useContext, useMemo, useState } from 'react';
import { createForm } from '@formily/core';
import { createSchemaField, observer, RecursionField, useField, useFieldSchema } from '@formily/react';
import { Form, FormItem, Input, Select } from '@formily/antd';
import { Button, Drawer, Space } from 'antd';
import 'antd/dist/antd.css';
import { createPortal } from 'react-dom';

const VisibleContext = createContext(null);

const useA = () => {
  return {
    async run() {},
  };
};

const Action: any = observer((props: any) => {
  const { useAction = useA } = props;
  const [visible, setVisible] = useState(false);
  const schema = useFieldSchema();
  const field = useField();
  const { run } = useAction();
  console.log(field.address);
  return (
    <VisibleContext.Provider value={[visible, setVisible]}>
      <Button
        onClick={() => {
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

function useCloseAction() {
  const [, setVisible] = useContext(VisibleContext);
  return {
    async run() {
      setVisible(false);
    },
  };
}

const SchemaField = createSchemaField({
  components: {
    Action,
  },
  scope: {
    useCloseAction,
  },
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
  // return <RecursionField basePath={field.address} schema={schema} onlyRenderProperties />
  return <SchemaField basePath={field.address} schema={schema} />;
});

export default () => {
  const form = useMemo(() => createForm(), []);
  return (
    <Form form={form} layout="vertical">
      <SchemaField
        schema={{
          type: 'object',
          properties: {
            a1: {
              'x-component': 'Action',
              title: '按钮',
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
                          title: '关闭',
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
        }}
      />
    </Form>
  );
};
