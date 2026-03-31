import { Form, Input } from 'antd';
import React from 'react';

export default function App() {
  const [form] = Form.useForm();
  return (
    <Form form={form} layout="vertical" initialValues={{ name: null }}>
      <Form.Item label="Name" name={'name'} initialValue={'默认值'}>
        <Input />
      </Form.Item>
      <Form.Item shouldUpdate>
        {() => (
          <div>
            当前表单值：<pre>{JSON.stringify(form.getFieldsValue(), null, 2)}</pre>
          </div>
        )}
      </Form.Item>
    </Form>
  );
}
