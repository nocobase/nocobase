import { Menu } from 'antd';
import React from 'react';
import { SaveOutlined, KeyOutlined, DatabaseOutlined, VerifiedOutlined, NotificationOutlined } from '@ant-design/icons';
import { PluginManager } from '@nocobase/client';

export const Plugin3 = () => null;
Plugin3.ToolbarItem = () => {
  return (
    <PluginManager.Toolbar.Item
      icon={<DatabaseOutlined />}
      title={'Plugin3'}
      onClick={() => {
        alert('Plugin3');
      }}
    />
  );
};
