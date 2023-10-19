import React from 'react';
import { Button, Checkbox, Form, Input } from 'antd';
import { data as userData } from '../../displayData';

type CustomInputs = {
  inputText?: String | Number;
};
const CustomInputs: React.FC<CustomInputs> = ({ inputText }) => {
  const [data, setData] = React.useState({
    username: '',
    age: '',
    address: '',
  });
  const onFinish = () => {
    // window.alert('Success:', data);
    console.log(data);
    userData.push({
      key: (Date.now() + Math.random()).toString(),
      name: 'Joe Black',
      age: 32,
      address: 'Sydney No. 1 Lake Park',
      tags: ['cool', 'teacher'],
    });
    console.log(userData);
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log('Failed:', errorInfo);
  };
  type FieldType = {
    username?: string;
    age?: string;
    address?: string;
  };
  return (
    <Form
      name="basic"
      style={{ maxWidth: 600, marginTop: 8 }}
      initialValues={{ remember: true }}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      autoComplete="off"
    >
      <Form.Item<FieldType>
        label="Username"
        name="username"
        rules={[{ required: true, message: 'Please input your username!' }]}
      >
        <Input onChange={(e) => setData({ ...data, username: e.target.value })} />
      </Form.Item>

      <Form.Item<FieldType> label="Age" name="age" rules={[{ required: true, message: 'Please input your age!' }]}>
        <Input onChange={(e) => setData({ ...data, age: e.target.value })} />
      </Form.Item>

      <Form.Item<FieldType>
        label="Address"
        name="address"
        rules={[{ required: true, message: 'Please input your address!' }]}
      >
        <Input onChange={(e) => setData({ ...data, address: e.target.value })} />
      </Form.Item>

      <Form.Item style={{ float: 'right' }}>
        <Button type="primary" htmlType="submit">
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
};

export default CustomInputs;
