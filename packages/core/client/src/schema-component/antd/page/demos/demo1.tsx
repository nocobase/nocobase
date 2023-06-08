import { ISchema } from '@formily/react';
import { DocumentTitleProvider, Page, SchemaComponent, SchemaComponentProvider } from '@nocobase/client';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

const schema: ISchema = {
  type: 'object',
  properties: {
    page1: {
      type: 'void',
      'x-component': 'Page',
      title: 'Page Title',
      properties: {
        content: {
          type: 'void',
          'x-component': 'div',
          'x-content': 'Page Content',
        },
      },
    },
  },
};

export default () => {
  return (
    <SchemaComponentProvider components={{ Page }}>
      <DocumentTitleProvider addonAfter={'NocoBase'}>
        <BrowserRouter>
          <SchemaComponent schema={schema} />
        </BrowserRouter>
      </DocumentTitleProvider>
    </SchemaComponentProvider>
  );
};
