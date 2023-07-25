import { TreeSelect as _TreeSelect } from 'antd';
import React, { useState } from 'react';
import type { ComponentDemo } from '../../interface';

const { TreeNode, _InternalPanelDoNotUseOrYouWillBeFired: TreeSelect } = _TreeSelect;

const Demo = () => {
  const [value, setValue] = useState(undefined);
  const onChange = () => {
    setValue(value);
  };
  return (
    <TreeSelect
      showSearch
      style={{ width: '100%' }}
      value={value}
      dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
      placeholder="Please select"
      allowClear
      treeDefaultExpandAll
      onChange={onChange}
    >
      <TreeNode value="parent 1" title="parent 1">
        <TreeNode value="parent 1-0" title="parent 1-0">
          <TreeNode value="leaf1" title="leaf1" />
          <TreeNode value="leaf2" title="leaf2" />
        </TreeNode>
        <TreeNode value="parent 1-1" title="parent 1-1">
          <TreeNode value="leaf3" title={'leaf3'} />
        </TreeNode>
      </TreeNode>
    </TreeSelect>
  );
};

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorPrimary', 'colorPrimaryActive', 'controlOutline', 'colorBgElevated', 'colorBgContainer'],
  key: 'default',
};

export default componentDemo;
