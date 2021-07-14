import { Button } from 'antd';
import React from 'react';
import { SchemaRenderer, useDesignable, useSchema } from '..';
import { uid } from '@formily/shared';

const Hello = () => {
  return <div>Hello</div>;
};

const AddNew = () => {
  const { schema, refresh, insertBefore } = useDesignable();
  return (
    <div>
      <Button
        onClick={() => {
          insertBefore({
            type: 'void',
            'x-component': 'Hello',
          });
          refresh();
          console.log({ schema });
        }}
      >
        Add New
      </Button>
    </div>
  );
};

export default () => {
  return (
    <SchemaRenderer
      debug={true}
      components={{ Hello, AddNew }}
      schema={{
        type: 'object',
        properties: {
          hello: {
            type: 'void',
            'x-component': 'Hello',
          },
          addnew: {
            type: 'void',
            'x-component': 'AddNew',
          },
        },
      }}
    />
  );
};
