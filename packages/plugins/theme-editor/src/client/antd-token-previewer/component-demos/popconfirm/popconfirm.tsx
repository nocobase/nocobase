import { Popconfirm, message } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

function confirm() {
  message.success('Click on Yes');
}
function cancel() {
  message.error('Click on No');
}
const Demo = () => (
  <div>
    <Popconfirm._InternalPanelDoNotUseOrYouWillBeFired
      title="Are you sure to delete this task?"
      onConfirm={confirm}
      onCancel={cancel}
      okText="Yes"
      cancelText="No"
      placement={'topLeft'}
    />
  </div>
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorBgElevated', 'colorWarning'],
  key: 'default',
};

export default componentDemo;
