import {
  AntdSchemaComponentProvider,
  Application,
  CollectionPlugin,
  CollectionProvider_deprecated,
  Filter,
  Input,
  LocalDataSource,
  SchemaComponent,
  useCollection_deprecated,
  Plugin,
  DEFAULT_DATA_SOURCE_KEY,
  DEFAULT_DATA_SOURCE_TITLE,
} from '@nocobase/client';
import { Select } from 'antd';
import React, { useState } from 'react';
import { useFilterOptions } from '../useFilterActionProps';

const collections = [
  {
    name: 'test1',
    template: 'general',
    fields: [
      {
        type: 'string',
        name: 'title1',
        interface: 'input',
        uiSchema: {
          title: 'Title1',
          type: 'string',
          'x-component': 'Input',
          required: true,
        },
      },
    ],
  },
  {
    name: 'test2',
    template: 'general',
    fields: [
      {
        type: 'string',
        name: 'title2',
        interface: 'input',
        uiSchema: {
          title: 'Title2',
          type: 'string',
          'x-component': 'Input',
          required: true,
        },
      },
    ],
  },
];

const schema: any = {
  type: 'void',
  properties: {
    demo: {
      name: 'filter',
      type: 'object',
      'x-component': 'Filter',
      'x-use-component-props': () => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const { name } = useCollection_deprecated();
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const options = useFilterOptions(name);
        return {
          options,
        };
      },
    },
  },
};

const SwitchCollection = (props) => {
  const [collection, setCollection] = useState(collections[0].name);
  return (
    <div>
      <Select
        options={[
          { label: 'test1', value: 'test1' },
          { label: 'test2', value: 'test2' },
        ]}
        defaultValue={'test1'}
        onChange={(value) => {
          setCollection(value);
        }}
      />
      <br />
      <br />
      <CollectionProvider_deprecated name={collection}>{props.children}</CollectionProvider_deprecated>
    </div>
  );
};

const Demo = () => {
  return (
    <AntdSchemaComponentProvider>
      <SwitchCollection>
        <SchemaComponent schema={schema} />
      </SwitchCollection>
    </AntdSchemaComponentProvider>
  );
};
class MyPlugin extends Plugin {
  async load() {
    this.app.dataSourceManager.addDataSource(LocalDataSource, {
      key: DEFAULT_DATA_SOURCE_KEY,
      displayName: DEFAULT_DATA_SOURCE_TITLE,
      collections: collections as any,
    });
  }
}
const app = new Application({
  plugins: [CollectionPlugin, MyPlugin],
  components: {
    Input,
    Filter,
  },
  providers: [Demo],
});

export default app.getRootComponent();
