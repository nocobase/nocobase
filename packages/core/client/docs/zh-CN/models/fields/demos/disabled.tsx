import { Form, FormItemProps, Input } from 'antd';
import React from 'react';

const FormItem = ({ disabled, children, ...rest }: FormItemProps & { disabled?: boolean }) => {
  const processedChildren =
    typeof children === 'function'
      ? children
      : React.Children.map(children as any[], (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement<any>(child, { disabled });
          }
          return child;
        });
  return <Form.Item {...rest}>{processedChildren}</Form.Item>;
};

export default function App() {
  const [form] = Form.useForm();
  return (
    <Form form={form} layout="vertical" initialValues={{ name: null }}>
      <FormItem disabled label="Name" name={'name'} initialValue={'默认值'}>
        <Input />
      </FormItem>
      <FormItem shouldUpdate>
        {(form) => (
          <div>
            当前表单值：<pre>{JSON.stringify(form.getFieldsValue(), null, 2)}</pre>
          </div>
        )}
      </FormItem>
    </Form>
  );
}
