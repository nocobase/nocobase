import React from 'react';
import { MobileTabBar } from '@nocobase/client';
import { AppstoreOutlined } from '@ant-design/icons';

const Demo = () => {
  return <MobileTabBar.Item title="Test" icon={<AppstoreOutlined />}></MobileTabBar.Item>;
};

export default Demo;
