import React from "react";
import { ISchema, SchemaComponent, Plugin } from "@nocobase/client";
import { mockApp } from "@nocobase/client/demo-utils";

const schema: ISchema = {
  name: 'test',
  'x-component': 'Action',
  'x-component-props': {
    type: 'primary',
    popover: true,
  },
  type: 'void',
  title: 'Open',
  properties: {
    popover: {
      type: 'void',
      'x-component': 'Action.Popover',
      properties: {
        hello: {
          type: 'void',
          'x-content': 'Hello',
        },
      },
    },
  },
}


const Demo = () => {
  return <SchemaComponent schema={schema} />;
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo })
  }
}

const app = mockApp({ plugins: [DemoPlugin] });

export default app.getRootComponent();
