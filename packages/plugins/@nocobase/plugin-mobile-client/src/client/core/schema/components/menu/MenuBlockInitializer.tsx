import React from 'react';
import { MenuOutlined } from '@ant-design/icons';
import { SchemaInitializerItem, useSchemaInitializer } from '@nocobase/client';

export const MMenuBlockInitializer = (props) => {
  const { insert } = useSchemaInitializer();
  return (
    <SchemaInitializerItem
      icon={<MenuOutlined />}
      onClick={async () => {
        insert({
          type: 'void',
          'x-component': 'MMenu',
          'x-designer': 'MMenu.Designer',
          'x-component-props': {},
        });
      }}
      {...props}
    />
  );
};
