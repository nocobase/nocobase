import React from 'react';
import {
  Application,
  Plugin,
  SchemaComponent,
  SchemaComponentProvider,
  SchemaSettings,
  useSchemaSettingsRender,
} from '@nocobase/client';
import { observer, useFieldSchema } from '@formily/react';

const mySchemaSetting = new SchemaSettings({
  name: 'MySchemaSetting',
  items: [
    {
      name: 'demo1',
      type: 'item',
      componentProps: {
        title: 'DEMO',
      },
    },
  ],
});

const DemoDesigner = () => {
  const filedSchema = useFieldSchema();
  // 从 schema 中读取 name
  const { exists, render } = useSchemaSettingsRender(filedSchema['x-settings'], filedSchema['x-settings-props']);

  return <div style={{ border: '1px solid red', padding: 50 }}>{exists && render()}</div>;
};

const Page = observer(
  (props) => {
    return (
      <div>
        {props.children}
        <DemoDesigner />
      </div>
    );
  },
  { displayName: 'Page' },
);

const Root = () => {
  return (
    <SchemaComponentProvider designable>
      <SchemaComponent
        components={{ Page }}
        schema={{
          type: 'void',
          name: 'page',
          'x-component': 'Page',
          'x-setting': 'MySchemaSetting',
        }}
      ></SchemaComponent>
    </SchemaComponentProvider>
  );
};

class MyPlugin extends Plugin {
  async load() {
    this.app.schemaSettingsManager.add(mySchemaSetting);
  }
}

const app = new Application({
  plugins: [MyPlugin],
  providers: [Root],
});

export default app.getRootComponent();
