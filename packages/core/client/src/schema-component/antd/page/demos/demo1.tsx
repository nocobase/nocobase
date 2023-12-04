import { ISchema } from '@formily/react';
import { DocumentTitleProvider, Page, SchemaComponent, SchemaComponentProvider, Application } from '@nocobase/client';
import React from 'react';

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

const Root = () => {
  return (
    <SchemaComponentProvider components={{ Page }}>
      <DocumentTitleProvider addonAfter={'NocoBase'}>
        <SchemaComponent schema={schema} />
      </DocumentTitleProvider>
    </SchemaComponentProvider>
  );
};

const app = new Application({
  providers: [Root],
});

export default app.getRootComponent();
