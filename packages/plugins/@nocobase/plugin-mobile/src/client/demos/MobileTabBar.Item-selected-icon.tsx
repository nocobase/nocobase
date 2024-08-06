import React from 'react';
import { MobileTabBar } from '@nocobase/plugin-mobile/client';

const Demo = () => {
  return (
    <MobileTabBar.Item
      title="Test"
      icon="AppstoreOutlined"
      selectedIcon="AppstoreAddOutlined"
      selected
    ></MobileTabBar.Item>
  );
};

export default Demo;
