import {
  RecordProviderV2,
  SchemaComponent,
  UseDataBlockProps,
  useRecordDataV2,
  useRecordV2,
  withSchemaComponentProps,
} from '@nocobase/client';
import { Button, Form, Input, InputNumber } from 'antd';
import { FormProps } from 'antd/lib';
import React, { FC, useEffect } from 'react';
import { createApp } from './createApp';

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
  const data = useRecordDataV2<DemoFormFieldType>();
  const [form] = Form.useForm();
  useEffect(() => {
    form.setFieldsValue(data);
  }, [data, form]);
  return {
    preserve: true,
    form,
  };
}

const useFormBlockDecoratorProps: UseDataBlockProps<'CollectionRecord'> = () => {
  const record = useRecordV2();
  return {
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
      record={{
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
