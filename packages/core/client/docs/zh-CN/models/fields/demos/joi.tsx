import { Form, Input } from 'antd';
import Joi from 'joi';
import React from 'react';

const schema = Joi.string().min(3).allow(null, ''); //.required();

export default function App() {
  const [form] = Form.useForm();
  return (
    <Form form={form} layout="vertical" initialValues={{}}>
      <Form.Item
        name="Name"
        rules={[
          {
            validator: (_, value) => {
              const { error } = schema.validate(value);
              if (error) {
                return Promise.reject(error.message);
              }
              return Promise.resolve();
            },
          },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item noStyle shouldUpdate>
        {() => (
          <div>
            当前表单值：<pre>{JSON.stringify(form.getFieldsValue(), null, 2)}</pre>
          </div>
        )}
      </Form.Item>
    </Form>
  );
}
