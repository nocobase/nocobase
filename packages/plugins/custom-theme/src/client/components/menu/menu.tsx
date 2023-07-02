import type { MenuProps } from 'antd';
import { Menu } from 'antd';
import React from 'react';

import { ComponentDemo } from '../../../types';
import items from './data';

const Demo: React.FC = () => {
  const onClick: MenuProps['onClick'] = (e) => {
    console.log('click ', e);
  };

  return (
    <div>
      <Menu
        onClick={onClick}
        style={{ width: 256 }}
        defaultSelectedKeys={['1']}
        defaultOpenKeys={['sub1', 'sub2']}
        mode="inline"
        items={items}
      />
    </div>
  );
};

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorPrimary', 'colorBgContainer', 'colorFillAlter', 'colorSplit', 'colorPrimaryHover'],
  key: 'default',
};

export default componentDemo;
