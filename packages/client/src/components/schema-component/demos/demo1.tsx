import React from 'react';
import { SchemaComponentProvider, SchemaComponent, useDesignable } from '@nocobase/client';
import { observer, Schema, useFieldSchema } from '@formily/react';
import { Button, Space } from 'antd';
import { uid } from '@formily/shared';

const Hello = observer((props) => {
  const { on, insertAdjacent } = useDesignable();
  const fieldSchema = useFieldSchema();
  return (
    <div>
      <h1>{fieldSchema.name}</h1>
      <Space>
        <Button
          onClick={() => {
            insertAdjacent('beforebegin', {
              'x-component': 'Hello',
              properties: {
                [uid()]: {
                  type: 'void',
                  'x-component': 'Hello',
                },
              },
            });
          }}
        >
          beforebegin
        </Button>
        <Button
          onClick={() => {
            insertAdjacent('afterbegin', {
              'x-component': 'Hello',
            });
          }}
        >
          afterbegin
        </Button>
        <Button
          onClick={() => {
            insertAdjacent('beforeend', {
              'x-component': 'Hello',
            });
          }}
        >
          beforeend
        </Button>
        <Button
          onClick={() => {
            insertAdjacent('afterend', {
              'x-component': 'Hello',
            });
          }}
        >
          afterend
        </Button>
      </Space>
      <div style={{ margin: 50 }}>{props.children}</div>
    </div>
  );
});

const Page = observer((props) => {
  return <div>{props.children}</div>;
});

export default function App() {
  return (
    <SchemaComponentProvider components={{ Page, Hello }}>
      <SchemaComponent
        schema={{
          type: 'void',
          name: 'page',
          'x-uid': uid(),
          'x-component': 'Page',
          properties: {
            hello1: {
              type: 'void',
              'x-uid': uid(),
              'x-component': 'Hello',
            },
          },
        }}
      />
    </SchemaComponentProvider>
  );
}
