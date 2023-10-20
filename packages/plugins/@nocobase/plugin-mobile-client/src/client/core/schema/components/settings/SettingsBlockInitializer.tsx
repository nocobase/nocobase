import React from 'react';
import { SettingOutlined } from '@ant-design/icons';
import { SchemaInitializer, useSchemaInitializerV2 } from '@nocobase/client';

export const MSettingsBlockInitializer = () => {
  const { insert } = useSchemaInitializerV2();
  return (
    <SchemaInitializer.Item
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
