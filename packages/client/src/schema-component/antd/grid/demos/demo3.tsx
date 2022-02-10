import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import { CardItem, Form, Grid, Markdown, SchemaComponent, SchemaComponentProvider, VoidTable } from '@nocobase/client';
import React from 'react';

const schema: ISchema = {
  type: 'void',
  name: 'grid1',
  'x-component': 'Grid',
  'x-item-initializer': 'Grid.AddBlockItem',
  'x-uid': uid(),
  properties: {},
};

export default function App() {
  return (
    <SchemaComponentProvider components={{ Grid, CardItem, Markdown, Form, VoidTable }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
}
