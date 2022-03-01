import { Switch } from 'antd';
import flat from 'flat';
import React from 'react';
import { SchemaInitializer } from '../../SchemaInitializer';
import { useCurrentSchema } from '../utils';

export const FilterActionInitializer = (props) => {
  const { item, insert } = props;
  const { exists, remove } = useCurrentSchema(item.schema['x-action'], 'x-action', item.find);

  return (
    <SchemaInitializer.Item
      onClick={() => {
        if (exists) {
          return remove();
        }
        insert({
          ...item.schema,
          name: 'filter',
          type: 'object',
          default: flat.unflatten({
            $or: [
              { 'aa.$eq': 'b' },
              { 'bb.field.$eq': ['aabb', 'aaa'] },
              {
                'bb.field': {
                  $eq: ['aabb', 'aaa'],
                },
              },
            ],
          }),
          'x-component': 'Filter',
          'x-component-props': {},
        });
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {item.title} <Switch style={{ marginLeft: 20 }} size={'small'} checked={exists} />
      </div>
    </SchemaInitializer.Item>
  );
};
