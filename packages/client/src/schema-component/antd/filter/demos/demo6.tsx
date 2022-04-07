import {
  AntdSchemaComponentProvider,
  CollectionManagerProvider,
  CollectionProvider,
  Filter,
  Input,
  SchemaComponent,
  SchemaComponentProvider,
  useCollection,
  useCollectionManager,
  useFilterOptions
} from '@nocobase/client';
import { Select } from 'antd';
import React, { useState } from 'react';

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
          const { name } = useCollection();
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
  const [collection, setCollection] = useState(collections[0]);
  const { getCollection } = useCollectionManager();
  return (
    <div>
      <Select
        options={[
          { label: 'test1', value: 'test1' },
          { label: 'test2', value: 'test2' },
        ]}
        defaultValue={'test1'}
        onChange={(value) => {
          setCollection(getCollection(value));
        }}
      />
      <br />
      <br />
      <CollectionProvider collection={collection}>{props.children}</CollectionProvider>
    </div>
  );
};

export default () => {
  return (
    <SchemaComponentProvider>
      <AntdSchemaComponentProvider>
        <CollectionManagerProvider collections={collections}>
          <SwitchCollection>
            <SchemaComponent components={{ Input, Filter }} schema={schema} />
          </SwitchCollection>
        </CollectionManagerProvider>
      </AntdSchemaComponentProvider>
    </SchemaComponentProvider>
  );
};
