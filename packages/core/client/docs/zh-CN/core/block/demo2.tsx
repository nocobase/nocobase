import React, { FC, useEffect, useState } from 'react';
import {
  RecordProviderV2,
  SchemaComponent,
  useDataBlockRequestV2,
  withSchemaComponentProps,
  UseDataBlockProps,
  useRecordDataV2,
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
  const data = useRecordDataV2<DemoFormFieldType>();
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

const useFormBlockDecoratorProps: UseDataBlockProps<'CollectionGet'> = () => {
  const { filterByTk } = useRecordDataV2<{ filterByTk: number }>();
  return {
    filterByTk,
  };
};

const collection = 'users';
const action = 'get';

const schema = {
  type: 'void',
  name: 'hello',
  'x-decorator': 'DataBlockProviderV2',
  'x-use-decorator-props': 'useFormBlockDecoratorProps',
  'x-component': 'DemoForm',
  'x-use-component-props': 'useDemoFormProps',
  'x-decorator-props': {
    collection: collection,
    action: action,
  },
};

const Demo = () => {
  const [id, setId] = useState(1);
  return (
    <RecordProviderV2 record={{ filterByTk: id }}>
      <Select
        defaultValue={id}
        options={[
          { key: 1, value: 1, label: 'Bamboo' },
          { key: 2, value: 2, label: 'Mary' },
        ]}
        onChange={(v) => {
          setId(v);
        }}
      ></Select>
      <SchemaComponent schema={schema}></SchemaComponent>
    </RecordProviderV2>
  );
};

const mocks = {
  [`${collection}:${action}`]: function (config) {
    const { filterByTk } = config.params;
    return {
      data:
        filterByTk === 1
          ? {
              id: 1,
              username: 'Bamboo',
              age: 18,
            }
          : {
              id: 2,
              username: 'Mary',
              age: 25,
            },
    };
  },
};

const Root = createApp(
  Demo,
  { components: { DemoForm }, scopes: { useDemoFormProps, useFormBlockDecoratorProps } },
  mocks,
);

export default Root;
