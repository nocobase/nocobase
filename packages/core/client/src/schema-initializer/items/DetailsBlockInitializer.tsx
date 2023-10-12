import { TableOutlined } from '@ant-design/icons';
import React from 'react';
import { useCollectionManager } from '../../collection-manager';
import { createDetailsBlockSchema } from '../utils';
import { DataBlockInitializer } from './DataBlockInitializer';
import { DataBlockInitializerV2, useSchemaInitializerV2 } from '../../application';

export const DetailsBlockInitializer = (props) => {
  const { insert } = props;
  const { getCollection } = useCollectionManager();
  return (
    <DataBlockInitializer
      {...props}
      icon={<TableOutlined />}
      componentType={'Details'}
      onCreateBlockSchema={async ({ item }) => {
        const collection = getCollection(item.name);
        const schema = createDetailsBlockSchema({
          collection: item.name,
          rowKey: collection.filterTargetKey || 'id',
          actionInitializers:
            (collection.template !== 'view' || collection?.writableView) &&
            collection.template !== 'sql' &&
            'DetailsActionInitializers',
        });
        insert(schema);
      }}
    />
  );
};

export const DetailsBlockInitializerV2 = (props) => {
  const { insert } = useSchemaInitializerV2();
  const { getCollection } = useCollectionManager();
  return (
    <DataBlockInitializerV2
      {...props}
      icon={<TableOutlined />}
      componentType={'Details'}
      onCreateBlockSchema={async ({ item }) => {
        const collection = getCollection(item.name);
        const schema = createDetailsBlockSchema({
          collection: item.name,
          rowKey: collection.filterTargetKey || 'id',
          actionInitializers:
            (collection.template !== 'view' || collection?.writableView) &&
            collection.template !== 'sql' &&
            'DetailsActionInitializers',
        });
        insert(schema);
      }}
    />
  );
};
