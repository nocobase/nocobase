import React from 'react';
import { SchemaRenderer } from '../../';

const schema = {
  type: 'object',
  properties: {
    input: {
      type: 'object',
      title: `编辑模式`,
      'x-decorator': 'FormItem',
      'x-component': 'Upload.File',
      'x-component-props': {
        multiple: true,
      },
      'x-reactions': {
        target: 'read',
        fulfill: {
          state: {
            value: '{{$self.value}}',
          },
        },
      },
    },
    read: {
      type: 'object',
      title: `阅读模式`,
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Upload.File',
      'x-component-props': {
        multiple: true,
      },
    },
  },
};

export default () => {
  return <SchemaRenderer debug schema={schema} />;
};
