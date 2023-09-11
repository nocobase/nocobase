import { Form, Input } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

function onFinish() {}

const Demo = () => (
  <Form
    name="basic"
    labelCol={{ span: 4 }}
    wrapperCol={{ span: 20 }}
    initialValues={{ remember: true }}
    onFinish={onFinish}
    autoComplete="off"
  >
    <Form.Item
      label="Username"
      name="username"
      status={'error'}
      rules={[{ required: true, message: 'Please input your username!' }]}
    >
      <Input />
    </Form.Item>
  </Form>
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorError', 'colorErrorBorder', 'colorErrorHover'],
  key: 'danger',
};

export default componentDemo;
