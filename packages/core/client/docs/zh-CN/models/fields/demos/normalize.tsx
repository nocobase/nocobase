import { DatePicker, Form, Input } from 'antd';
import dayjs from 'dayjs';
import React from 'react';

type FieldType = {
  date?: string;
};

const dateTimestamp = dayjs('2024-01-01').valueOf();

export default function App() {
  const [form] = Form.useForm();
  return (
    <Form form={form} layout="vertical" initialValues={{ date: dateTimestamp }}>
      <Form.Item<FieldType>
        label="Date"
        name="date"
        rules={[{ required: true }]}
        getValueProps={(value) => ({ value: value && dayjs(Number(value)) })}
        normalize={(value) => value && `${dayjs(value).valueOf()}`}
      >
        <DatePicker />
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
