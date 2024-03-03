import { FormOutlined } from '@ant-design/icons';
import { SchemaInitializerItem, useSchemaInitializer, useSchemaInitializerItem } from '@nocobase/client';
import React from 'react';

export const IframeBlockInitializer = () => {
  const { insert } = useSchemaInitializer();
  const itemConfig = useSchemaInitializerItem();
  return (
    <SchemaInitializerItem
      {...itemConfig}
      icon={<FormOutlined />}
      onClick={() => {
        insert({
          type: 'void',
          'x-settings': 'blockSettings:iframe',
          'x-decorator': 'BlockItem',
          'x-decorator-props': {
            name: 'iframe',
          },
          'x-component': 'Iframe',
          'x-component-props': {},
        });
      }}
    />
  );
};
