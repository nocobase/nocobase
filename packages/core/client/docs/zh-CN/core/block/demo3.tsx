import React, { FC } from 'react';
import { SchemaComponent, useDataBlockResourceV2, withDynamicSchemaProps } from '@nocobase/client';
import { createApp } from './createApp';
import { Button, Form, Input, InputNumber } from 'antd';
import { FormProps } from 'antd/lib';

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
  const resource = useDataBlockResourceV2();
  return {
    onFinish: (values) => {
      resource.create({ values });
    },
  };
}

const collection = 'users';

const schema = {
  type: 'void',
  name: 'hello',
  'x-decorator': 'DataBlockProviderV2',
  'x-component': 'DemoForm',
  'x-use-component-props': 'useDemoFormProps',
  'x-decorator-props': {
    collection: collection,
  },
};

const Demo = () => {
  return <SchemaComponent schema={schema}></SchemaComponent>;
};

const mocks = {
  [`${collection}:create`]: (config) => {
    console.log('请求结果', config.data);
    return [200, { msg: 'ok' }];
  },
};

const Root = createApp(Demo, { components: { DemoForm }, scopes: { useDemoFormProps } }, mocks);

export default Root;
