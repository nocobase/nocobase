import React from 'react';
import { SchemaComponentProvider, SchemaComponent, useDesignable } from '@nocobase/client';
import { observer, Schema, useFieldSchema } from '@formily/react';
import { Button, Space } from 'antd';
import { uid } from '@formily/shared';

const Hello = () => {
  const { patch, insertBefore, insertAfter, remove } = useDesignable();
  const fieldSchema = useFieldSchema();
  return (
    <div>
      <h1>{fieldSchema.name}</h1>
      <Space>
        <Button
          onClick={() => {
            patch({
              title: uid(),
            });
          }}
        >
          patch
        </Button>
        <Button
          onClick={() => {
            insertBefore({
              name: uid(),
              'x-component': 'Hello',
            });
          }}
        >
          insertBefore
        </Button>
        <Button
          onClick={() => {
            insertAfter({
              name: uid(),
              'x-component': 'Hello',
            });
          }}
        >
          insertAfter
        </Button>
        <Button onClick={() => remove()}>remove</Button>
      </Space>
    </div>
  );
};

const Page = observer((props) => {
  const { append, prepend } = useDesignable();
  return (
    <div>
      <div>
        <Space>
          <Button
            onClick={() => {
              append({
                name: uid(),
                'x-component': 'Hello',
              });
            }}
          >
            append
          </Button>
          <Button
            onClick={() => {
              prepend({
                name: uid(),
                'x-component': 'Hello',
              });
            }}
          >
            prepend
          </Button>
        </Space>
      </div>
      <div>{props.children}</div>
    </div>
  );
});

export default function App() {
  return (
    <SchemaComponentProvider components={{ Page, Hello }}>
      <SchemaComponent
        schema={{
          type: 'void',
          name: 'page',
          'x-component': 'Page',
          properties: {
            hello1: {
              'x-component': 'Hello',
            },
            hello2: {
              'x-component': 'Hello',
            },
          },
        }}
      />
    </SchemaComponentProvider>
  );
}
