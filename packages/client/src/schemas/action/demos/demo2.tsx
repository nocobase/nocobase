import React from 'react';
import { SchemaRenderer } from '@nocobase/client';

const schema = {
  type: 'void',
  name: 'action1',
  title: '按钮',
  'x-component': 'Action.Link',
  'x-component-props': {
    to: 'abc',
  },
};

export default () => {
  return <SchemaRenderer schema={schema} />;
};
