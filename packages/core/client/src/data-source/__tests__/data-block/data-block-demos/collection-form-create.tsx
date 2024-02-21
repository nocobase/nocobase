import React, { FC } from 'react';
import { Button, Form, FormProps, Input, InputNumber, notification } from 'antd';
import { SchemaComponent, useDataBlockResource, withDynamicSchemaProps } from '@nocobase/client';
import { ISchema } from '@formily/json-schema';
import { createApp } from './createApp';

interface DemoFormFieldType {
  id: number;
  username: string;
  age: number;
}
type DemoFormProps = FormProps<DemoFormFieldType>;
const DemoForm: FC<DemoFormProps> = withDynamicSchemaProps((props) => {
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
  const resource = useDataBlockResource();
  const onFinish = async (values: DemoFormFieldType) => {
    console.log('values', values);
    await resource.create({
      values,
    });
    notification.success({
      message: 'Save successfully!',
    });
  };

  return {
    onFinish,
  };
}

const collection = 'users';

const schema: ISchema = {
  type: 'void',
  name: 'root',
  'x-decorator': 'DataBlockProvider',
  'x-decorator-props': {
    collection: collection,
  },
  'x-component': 'CardItem',
  properties: {
    demo: {
      type: 'object',
      'x-component': 'DemoForm',
      'x-use-component-props': 'useDemoFormProps',
    },
  },
};

const Demo = () => {
  return <SchemaComponent schema={schema}></SchemaComponent>;
};

const mocks = {
  [`${collection}:create`]: (config) => {
    console.log('config.data', config.data);
    return [200, { msg: 'ok' }];
  },
};
const Root = createApp(
  Demo,
  {
    components: { DemoForm },
    scopes: { useDemoFormProps },
  },
  mocks,
);

export default Root;
