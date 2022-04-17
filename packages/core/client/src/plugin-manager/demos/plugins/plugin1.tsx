import React from 'react';
import { DatabaseOutlined } from '@ant-design/icons';
import { PluginManager } from '@nocobase/client';

export const Plugin1 = () => null;
Plugin1.ToolbarItem = () => {
  return (
    <PluginManager.Toolbar.Item
      icon={<DatabaseOutlined />}
      title={'Plugin1'}
      onClick={() => {
        alert('Plugin1');
      }}
    />
  );
};
