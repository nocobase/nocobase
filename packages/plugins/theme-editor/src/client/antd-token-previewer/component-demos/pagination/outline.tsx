import { Pagination, Space } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const Demo: React.FC = () => (
  <Space direction={'vertical'}>
    <Pagination showQuickJumper pageSize={1} defaultCurrent={2} total={10} />
  </Space>
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorPrimary', 'controlOutline', 'colorPrimaryHover', 'colorBgContainer'],
  key: 'outline',
};

export default componentDemo;
