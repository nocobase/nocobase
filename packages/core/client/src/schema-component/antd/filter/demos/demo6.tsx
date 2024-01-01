import {
  AntdSchemaComponentProvider,
  Application,
  CollectionProviderV2,
  Filter,
  Input,
  SchemaComponent,
  SchemaComponentProvider,
  useCollectionManagerV2,
  useCollectionV2,
} from '@nocobase/client';
import { Select } from 'antd';
import React, { useState } from 'react';
import { useFilterOptions } from '../useFilterActionProps';

const collections = [
  {
    name: 'test1',
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
      'x-component-props': {
        useProps: () => {
          const { name } = useCollectionV2();
          const options = useFilterOptions(name);
          return {
            options,
          };
        },
      },
    },
  },
};

const SwitchCollection = (props) => {
  const [collection, setCollection] = useState<any>(collections[0]);
  const cm = useCollectionManagerV2();
  return (
    <div>
      <Select
        options={[
          { label: 'test1', value: 'test1' },
          { label: 'test2', value: 'test2' },
        ]}
        defaultValue={'test1'}
        onChange={(value) => {
          setCollection(cm.getCollection(value).getOptions());
        }}
      />
      <br />
      <br />
      <CollectionProviderV2 name={collection.name}>{props.children}</CollectionProviderV2>
    </div>
  );
};

const Root = () => {
  return (
    <SchemaComponentProvider>
      <AntdSchemaComponentProvider>
        <SwitchCollection>
          <SchemaComponent components={{ Input, Filter }} schema={schema} />
        </SwitchCollection>
      </AntdSchemaComponentProvider>
    </SchemaComponentProvider>
  );
};

const app = new Application({
  providers: [Root],
  collectionManager: {
    collections: collections,
  },
});

export default app.getRootComponent();
