import React, { FC, useEffect, useState } from 'react';
import {
  RecordProviderV2,
  SchemaComponent,
  useBlockRequestV2,
  withSchemaComponentProps,
  DataBlockDecorator,
  useRecordV2,
} from '@nocobase/client';
import { createApp } from './createApp';
import { Button, Form, Input, InputNumber, Select } from 'antd';
import { FormProps } from 'antd/lib';

interface DemoFormFieldType {
  id: number;
  username: string;
  age: number;
}
type DemoFormProps = FormProps<DemoFormFieldType>;
const DemoForm: FC<DemoFormProps> = withSchemaComponentProps((props) => {
  return (
    <Form labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} style={{ maxWidth: 600 }} autoComplete="off" {...props}>
      <Form.Item<DemoFormFieldType>
        label="Username"
        name="username"
        rules={[{ required: true, message: 'Please input your username!' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item<DemoFormFieldType>
        label="Age"
        name="age"
        rules={[{ required: true, message: 'Please input your age!' }]}
      >
        <InputNumber />
      </Form.Item>
      <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
        <Button type="primary" htmlType="submit">
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
});

function useDemoFormProps(): DemoFormProps {
  const { data } = useBlockRequestV2<DemoFormFieldType>();
  const [form] = Form.useForm();
  useEffect(() => {
    form.setFieldsValue(data);
  }, [data, form]);
  return {
    initialValues: data,
    preserve: true,
    form,
  };
}

const useFormBlockDecoratorProps: DataBlockDecorator = () => {
  const record = useRecordV2();
  return {
    type: 'collection-record',
    record,
  };
};

const collection = 'users';

const schema = {
  type: 'void',
  name: 'hello',
  'x-decorator': 'DataBlockProviderV2',
  'x-use-decorator-props': 'useFormBlockDecoratorProps',
  'x-component': 'DemoForm',
  'x-use-component-props': 'useDemoFormProps',
  'x-decorator-props': {
    collection: collection,
  },
};

const Demo = () => {
  return (
    <RecordProviderV2
      current={{
        id: 1,
        username: 'Bamboo',
        age: 18,
      }}
    >
      <SchemaComponent schema={schema}></SchemaComponent>
    </RecordProviderV2>
  );
};

const Root = createApp(Demo, { components: { DemoForm }, scopes: { useDemoFormProps, useFormBlockDecoratorProps } });

export default Root;
