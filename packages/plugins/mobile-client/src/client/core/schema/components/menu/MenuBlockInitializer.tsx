import React from 'react';
import { MenuOutlined } from '@ant-design/icons';
import { SchemaInitializer } from '@nocobase/client';

export const MMenuBlockInitializer = (props) => {
  const { insert } = props;
  return (
    <SchemaInitializer.Item
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
