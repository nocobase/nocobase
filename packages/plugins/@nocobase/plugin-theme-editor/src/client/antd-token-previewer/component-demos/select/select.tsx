import { Select as _Select, Space } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const { Option, _InternalPanelDoNotUseOrYouWillBeFired: Select } = _Select;

function handleChange() {}
const Demo = () => (
  <Space align={'start'}>
    <Select defaultValue="lucy" style={{ width: 120 }} onChange={handleChange}>
      <Option value="jack">Jack</Option> <Option value="lucy">Lucy</Option>
      <Option value="disabled" disabled>
        Disabled
      </Option>
      <Option value="Yiminghe">yiminghe</Option>
    </Select>
    <Select defaultValue="lucy" style={{ width: 120 }} disabled>
      <Option value="lucy">Lucy</Option>
    </Select>
    <Select defaultValue="lucy" style={{ width: 120 }} loading>
      <Option value="lucy">Lucy</Option>
    </Select>
    <Select defaultValue="lucy" style={{ width: 120 }} allowClear>
      <Option value="lucy">Lucy</Option>
    </Select>
  </Space>
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['controlOutline', 'colorPrimary', 'colorPrimaryHover', 'colorText', 'colorBgElevated', 'colorBgContainer'],
  key: 'select',
};

export default componentDemo;
