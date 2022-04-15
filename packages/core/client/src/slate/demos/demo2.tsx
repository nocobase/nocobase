import { FormItem } from '@formily/antd';
import { SchemaComponent, SchemaComponentProvider, Slate } from '@nocobase/client';
import React from 'react';

let value = [
  {
    type: 'heading-one',
    children: [
      {
        text: 'Slate Rich Text Editor',
      },
    ],
  },
  {
    type: 'block-quote',
    children: [
      {
        text: 'this is based in Slate',
      },
    ],
  },
  {
    type: 'bulleted-list',
    children: [
      {
        type: 'list-item',
        children: [
          {
            text: 'The editor\'s "schema" was hardcoded and hard to customize. ',
          },
        ],
      },
      {
        type: 'list-item',
        children: [
          {
            text: 'Transforming the documents programmatically was very convoluted. ',
          },
        ],
      },
      {
        type: 'list-item',
        children: [
          {
            text: 'Serializing to HTML, Markdown, etc. seemed like an afterthought. ',
          },
        ],
      },
      {
        type: 'list-item',
        children: [
          {
            text: 'Re-inventing the view layer seemed inefficient and limiting.',
          },
        ],
      },
    ],
  },
];
const schema = {
  type: 'object',
  properties: {
    read: {
      type: 'string',
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Slate.RichText',
      default: value,
    },
  },
};

export default () => {
  return (
    <SchemaComponentProvider components={{ Slate, FormItem }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
