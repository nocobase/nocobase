import React from 'react';
import { SettingOutlined } from '@ant-design/icons';
import { SchemaInitializerItem, useSchemaInitializerV2 } from '@nocobase/client';

export const MSettingsBlockInitializer = () => {
  const { insert } = useSchemaInitializerV2();
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
    />
  );
};
