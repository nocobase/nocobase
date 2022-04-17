import { Menu } from 'antd';
import React from 'react';
import { SaveOutlined, KeyOutlined, DatabaseOutlined, VerifiedOutlined, NotificationOutlined } from '@ant-design/icons';
import { PluginManager } from '@nocobase/client';

export const Plugin5 = () => null;
Plugin5.ToolbarItem = () => {
  return (
    <PluginManager.Toolbar.Item
      icon={<DatabaseOutlined />}
      title={'Plugin5'}
      onClick={() => {
        alert('Plugin5');
      }}
    />
  );
};
