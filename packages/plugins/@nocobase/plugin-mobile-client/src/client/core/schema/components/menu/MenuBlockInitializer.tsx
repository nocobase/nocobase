import React from 'react';
import { MenuOutlined } from '@ant-design/icons';
import { SchemaInitializerItem, useSchemaInitializerV2 } from '@nocobase/client';

export const MMenuBlockInitializer = () => {
  const { insert } = useSchemaInitializerV2();
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
    />
  );
};
