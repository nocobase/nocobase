import { Pagination } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const Demo: React.FC = () => <Pagination showQuickJumper defaultCurrent={2} total={10} disabled />;

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['controlItemBgActiveDisabled', 'colorBgContainerDisabled', 'colorFillAlter'],
  key: 'disabled',
};

export default componentDemo;
