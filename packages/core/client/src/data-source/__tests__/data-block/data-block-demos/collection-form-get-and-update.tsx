import React, { FC, useEffect } from 'react';
import { Button, Form, FormProps, Input, InputNumber, Select, notification } from 'antd';
import {
  SchemaComponent,
  UseDataBlockProps,
  useDataBlockResource,
  useCollectionRecordData,
  withDynamicSchemaProps,
} from '@nocobase/client';
import { ISchema } from '@formily/json-schema';
import useUrlState from '@ahooksjs/use-url-state';

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
const useBlockDecoratorProps: UseDataBlockProps<'CollectionGet'> = () => {
  const [state] = useUrlState({ id: '1' });
  return {
    filterByTk: state.id,
  };
};

const collection = 'users';
const action = 'get';

const schema: ISchema = {
  type: 'void',
  name: 'root',
  'x-decorator': 'DataBlockProvider',
  'x-use-decorator-props': 'useBlockDecoratorProps',
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

const Demo = () => {
  const [state, setState] = useUrlState({ id: '1' });

  return (
    <>
      <Select
        defaultValue={state.id}
        options={[
          { key: 1, value: '1', label: 'Bamboo' },
          { key: 2, value: '2', label: 'Mary' },
        ]}
        onChange={(v) => {
          setState({ id: v });
        }}
      ></Select>
      <SchemaComponent schema={schema}></SchemaComponent>
    </>
  );
};

const mocks = {
  [`${collection}:${action}`]: function (config) {
    const { filterByTk } = config.params;
    return {
      data:
        Number(filterByTk) === 1
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
    scopes: { useDemoFormProps, useBlockDecoratorProps },
  },
  mocks,
);

export default Root;
