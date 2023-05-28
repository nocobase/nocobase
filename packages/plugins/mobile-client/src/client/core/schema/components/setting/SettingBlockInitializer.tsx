import React from 'react';
import { SettingOutlined } from '@ant-design/icons';
import { SchemaInitializer } from '@nocobase/client';

export const MSettingBlockInitializer = (props) => {
  const { insert } = props;
  return (
    <SchemaInitializer.Item
      icon={<SettingOutlined />}
      onClick={async () => {
        insert({
          type: 'void',
          'x-component': 'MSetting',
          'x-designer': 'MSetting.Designer',
          'x-component-props': {},
        });
      }}
    />
  );
};
