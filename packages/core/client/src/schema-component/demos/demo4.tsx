import { SchemaComponentProvider, useSchemaComponentContext } from '@nocobase/client';
import { Button } from 'antd';
import React from 'react';

const Test = () => {
  const { designable, setDesignable } = useSchemaComponentContext();
  return (
    <Button
      style={{ marginBottom: 24 }}
      onClick={() => {
        setDesignable(!designable);
      }}
    >
      designable: {designable ? 'true' : 'false'}
    </Button>
  );
};

export default () => {
  return (
    <SchemaComponentProvider designable={false}>
      <Test />
    </SchemaComponentProvider>
  );
};
