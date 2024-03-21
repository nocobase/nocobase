import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import {
  Application,
  CardItem,
  Grid,
  Markdown,
  Plugin,
  MarkdownBlockInitializer,
  SchemaComponent,
  SchemaComponentProvider,
  SchemaInitializer,
} from '@nocobase/client';
import React from 'react';

const gridRowColWrap = (schema) => {
  return {
    type: 'void',
    'x-component': 'Grid.Row',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'Grid.Col',
        properties: {
          [schema.name || uid()]: schema,
        },
      },
    },
  };
};

export const addBlockButton = new SchemaInitializer({
  name: 'addBlockButton',
  title: 'Add block',
  wrap: gridRowColWrap,
  items: [
    {
      name: 'media',
      type: 'itemGroup',
      title: 'Other blocks',
      children: [
        {
          name: 'markdown',
          title: 'Markdown',
          Component: 'MarkdownBlockInitializer',
        },
      ],
    },
  ],
});

const schema: ISchema = {
  type: 'object',
  properties: {
    grid: {
      type: 'void',
      'x-component': 'Grid',
      'x-initializer': 'addBlockButton',
      'x-uid': uid(),
      properties: {},
    },
  },
};

function Root() {
  return (
    <SchemaComponentProvider components={{ Grid, CardItem, Markdown, MarkdownBlockInitializer }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
}

class MyPlugin extends Plugin {
  async load() {
    // 注册路由
    this.app.router.add('root', {
      path: '/',
      Component: Root,
    });

    this.app.schemaInitializerManager.add(addBlockButton);
  }
}

const app = new Application({
  router: {
    type: 'memory',
    initialEntries: ['/'],
  },
  plugins: [MyPlugin],
});

export default app.getRootComponent();
