/**
 * title: Insert Adjacent
 */
import React from 'react';
import { SchemaComponentProvider, SchemaComponent, useDesignable } from '@nocobase/client';
import { observer, Schema, useFieldSchema } from '@formily/react';
import { Button, Space } from 'antd';
import { uid } from '@formily/shared';

const Hello = observer(
  (props) => {
    const { insertAdjacent } = useDesignable();
    const fieldSchema = useFieldSchema();
    return (
      <div>
        <h1>{fieldSchema.name}</h1>
        <Space>
          <Button
            onClick={() => {
              insertAdjacent('beforeBegin', {
                'x-component': 'Hello',
              });
            }}
          >
            before begin
          </Button>
          <Button
            onClick={() => {
              insertAdjacent('afterBegin', {
                'x-component': 'Hello',
              });
            }}
          >
            after begin
          </Button>
          <Button
            onClick={() => {
              insertAdjacent('beforeEnd', {
                'x-component': 'Hello',
              });
            }}
          >
            before end
          </Button>
          <Button
            onClick={() => {
              insertAdjacent('afterEnd', {
                'x-component': 'Hello',
              });
            }}
          >
            after end
          </Button>
        </Space>
        <div style={{ margin: 50 }}>{props.children}</div>
      </div>
    );
  },
  { displayName: 'Hello' },
);

const Page = observer(
  (props) => {
    return <div>{props.children}</div>;
  },
  { displayName: 'Page' },
);

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
