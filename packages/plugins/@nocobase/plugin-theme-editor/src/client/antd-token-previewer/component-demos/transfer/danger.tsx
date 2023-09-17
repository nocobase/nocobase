import { Transfer } from 'antd';
import React, { useState } from 'react';

import type { ComponentDemo } from '../../interface';

import mockData from './data';

const initialTargetKeys = mockData.filter((item) => +item.key > 10).map((item) => item.key);

const Demo = () => {
  const [targetKeys, setTargetKeys] = useState(initialTargetKeys);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const onScroll = () => {};
  return (
    <Transfer
      dataSource={mockData}
      titles={['Source', 'Target']}
      targetKeys={targetKeys}
      status={'error'}
      selectedKeys={selectedKeys}
      onChange={(nextTargetKeys) => {
        setTargetKeys(nextTargetKeys);
      }}
      onSelectChange={(sourceSelectedKeys, targetSelectedKeys) => {
        setSelectedKeys([...sourceSelectedKeys, ...targetSelectedKeys]);
      }}
      onScroll={onScroll}
      render={(item) => item.title}
    />
  );
};

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorError'],
  key: 'danger',
};

export default componentDemo;
