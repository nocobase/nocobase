import { Switch } from 'antd';
import React from 'react';
import { SchemaInitializer } from '../../SchemaInitializer';
import { useCurrentSchema } from '../utils';

export const BulkDestroyActionInitializer = (props) => {
  const { item, insert } = props;
  const { exists, remove } = useCurrentSchema(item?.schema?.['x-action'] || 'destroy', 'x-action', item.find);

  return (
    <SchemaInitializer.Item
      onClick={() => {
        if (exists) {
          return remove();
        }
        insert({
          title: '{{ t("Delete") }}',
          'x-action': 'destroy',
          'x-component': 'Action',
          'x-designer': 'Action.Designer',
          'x-component-props': {
            confirm: {
              title: "{{t('Delete record')}}",
              content: "{{t('Are you sure you want to delete it?')}}",
            },
            // useProps: '{{ bp.useBulkDestroyActionProps }}',
          },
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
