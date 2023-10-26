import React from 'react';
import { SettingOutlined } from '@ant-design/icons';
import { SchemaInitializerItem, useSchemaInitializer } from '@nocobase/client';

export const MSettingsBlockInitializer = (props) => {
  const { insert } = useSchemaInitializer();
  return (
    <SchemaInitializerItem
      icon={<SettingOutlined />}
      onClick={async () => {
        insert({
          type: 'void',
          'x-component': 'MSettings',
          'x-designer': 'MSettings.Designer',
          'x-component-props': {},
        });
      }}
      {...props}
    />
  );
};
