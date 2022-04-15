import { ISchema, observer, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import {
  BlockItem,
  CardItem,
  DragHandler,
  Form,
  Grid,
  Markdown,
  SchemaComponent,
  SchemaComponentProvider,
  SchemaInitializerProvider
} from '@nocobase/client';
import React from 'react';

const Block = observer((props) => {
  const fieldSchema = useFieldSchema();
  return (
    <div style={{ marginBottom: 20, padding: '0 20px', height: 50, lineHeight: '50px', background: '#f1f1f1' }}>
      Block {fieldSchema.title}
      <DragHandler />
    </div>
  );
});

const schema: ISchema = {
  type: 'object',
  properties: {
    grid: {
      type: 'void',
      'x-component': 'Grid',
      'x-item-initializer': 'AddBlockItem',
      'x-uid': uid(),
      properties: {},
    },
  },
};

export default function App() {
  return (
    <SchemaComponentProvider components={{ BlockItem, Block, Grid, CardItem, Markdown, Form }}>
      <SchemaInitializerProvider>
        <SchemaComponent schema={schema} />
      </SchemaInitializerProvider>
    </SchemaComponentProvider>
  );
}
