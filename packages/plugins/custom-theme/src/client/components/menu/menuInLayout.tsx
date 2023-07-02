import { Menu, theme } from 'antd';
import React from 'react';
import { ComponentDemo } from '../../../types';
import items from './data';

const Demo: React.FC = () => {
  const { token } = theme.useToken();
  return (
    <div style={{ background: token.colorBorderSecondary, padding: 12 }}>
      <Menu style={{ width: 256 }} defaultSelectedKeys={['1']} defaultOpenKeys={['sub1']} mode="inline" items={items} />
    </div>
  );
};

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorSplit'],
  key: 'menuInLayout',
};

export default componentDemo;
