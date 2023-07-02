import { Pagination, Space } from 'antd';
import React from 'react';
import { ComponentDemo } from '../../../types';

const Demo: React.FC = () => (
  <Space direction={'vertical'}>
    <Pagination showQuickJumper defaultCurrent={2} total={500} />

    <Pagination simple />
  </Space>
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorPrimary', 'colorPrimaryHover', 'colorBgContainer'],
  key: 'default',
};

export default componentDemo;
