import React, { FC, useEffect } from 'react';
import { Button, Form, FormProps, Input, InputNumber, notification } from 'antd';
import {
  CollectionRecordProvider,
  SchemaComponent,
  UseDataBlockProps,
  useDataBlockResource,
  useCollectionRecordData,
  withDynamicSchemaProps,
} from '@nocobase/client';
import { ISchema } from '@formily/json-schema';

import { createApp } from '../../../data-source/demos/createApp';

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
  const data = useCollectionRecordData<DemoFormFieldType>();
  const resource = useDataBlockResource();

  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue(data);
  }, [data, form]);

  const onFinish = async (values: DemoFormFieldType) => {
    console.log('values', values);
    await resource.update({
      filterByTk: data.id,
      values,
    });
    notification.success({
      message: 'Save successfully!',
    });
  };

  return {
    initialValues: data,
    preserve: true,
    onFinish,
    form,
  };
}
const useFormBlockDecoratorProps: UseDataBlockProps<'CollectionRecord'> = () => {
  const record = useCollectionRecordData();
  return {
    record,
  };
};

const collection = 'users';
const action = 'get';

const schema: ISchema = {
  type: 'void',
  name: 'root',
  'x-decorator': 'DataBlockProvider',
  'x-use-decorator-props': 'useFormBlockDecoratorProps',
  'x-decorator-props': {
    collection: collection,
    action: action,
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

const recordData = {
  id: 1,
  username: 'Bamboo',
  age: 18,
};

const Demo = () => {
  return (
    <>
      <CollectionRecordProvider record={recordData}>
        <SchemaComponent schema={schema}></SchemaComponent>
      </CollectionRecordProvider>
    </>
  );
};

const mocks = {
  [`${collection}:update`]: function (config) {
    console.log('config.data', config.data);
    return {
      data: 'ok',
    };
  },
};
const Root = createApp(
  Demo,
  {
    components: { DemoForm },
    scopes: { useDemoFormProps, useFormBlockDecoratorProps },
  },
  mocks,
);

export default Root;
