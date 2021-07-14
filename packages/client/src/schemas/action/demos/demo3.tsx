import React from 'react';
import { SchemaRenderer } from '@nocobase/client';

const schema = {
  type: 'void',
  name: 'action1',
  title: '按钮',
  'x-component': 'Action.URL',
  'x-component-props': {
    url: 'https://www.nocobase.com/',
  },
};

export default () => {
  return <SchemaRenderer schema={schema} />;
};
