import { Switch } from 'antd';
import React from 'react';
import { SchemaInitializer } from '../../SchemaInitializer';
import { useCurrentSchema } from '../utils';

export const CollectionFieldInitializer = (props) => {
  const { item, insert } = props;
  const { exists, remove } = useCurrentSchema(
    item.schema['x-collection-field'],
    'x-collection-field',
    item.find,
    item.remove,
  );
  return (
    <SchemaInitializer.Item
      onClick={() => {
        console.log(item, exists);
        if (exists) {
          return remove();
        }
        insert({
          ...item.schema,
        });
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {item.title} <Switch style={{ marginLeft: 20 }} size={'small'} checked={exists} />
      </div>
    </SchemaInitializer.Item>
  );
};
