/**
 * title: Markdown
 */
import { FormItem } from '@formily/antd';
import { Markdown, SchemaComponent, SchemaComponentProvider } from '@nocobase/client';
import React from 'react';

const schema = {
  type: 'object',
  properties: {
    pretty: {
      type: 'string',
      title: `Read pretty`,
      'x-decorator': 'FormItem',
      'x-component': 'Markdown.Void',
      'x-component-props': {
        content: '# Markdown content',
      },
    },
  },
};

export default () => {
  return (
    <SchemaComponentProvider components={{ Markdown, FormItem }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
