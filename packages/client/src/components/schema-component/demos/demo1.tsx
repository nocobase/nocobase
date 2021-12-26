import React from 'react';
import { SchemaComponentProvider, SchemaComponent } from '@nocobase/client';

const Hello = () => <div>Hello</div>;

export default function App() {
  return (
    <SchemaComponentProvider components={{ Hello }}>
      <SchemaComponent
        schema={{
          name: 'hello',
          'x-component': 'Hello',
        }}
      />
    </SchemaComponentProvider>
  );
}
