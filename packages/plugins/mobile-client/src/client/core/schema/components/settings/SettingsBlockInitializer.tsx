import React from 'react';
import { SettingOutlined } from '@ant-design/icons';
import { SchemaInitializer } from '@nocobase/client';

export const MSettingsBlockInitializer = (props) => {
  const { insert } = props;
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
