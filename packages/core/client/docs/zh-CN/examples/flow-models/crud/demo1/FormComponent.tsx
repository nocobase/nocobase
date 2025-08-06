import { FlowModelContext, MultiRecordResource, useFlowContext } from '@nocobase/flow-engine';
import { Button, Flex, Form, Input, Space } from 'antd';
import React from 'react';

export const FormComponent = (props) => {
  const { record } = props;
  const [form] = Form.useForm();
  const ctx = useFlowContext<FlowModelContext & { resource: MultiRecordResource }>();
  const { Header, Footer } = ctx.view;

  return (
    <div>
      <Header title={record ? 'Edit record' : 'Add record'} />

      <Form form={form} initialValues={record} layout="vertical" colon={true}>
        <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please enter name' }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Telephone" name="telephone" rules={[{ required: true, message: 'Please enter telephone' }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Live" name="live">
          <Input />
        </Form.Item>
        <Form.Item label="Address" name="address">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item label="Remark" name="remark">
          <Input />
        </Form.Item>
      </Form>

      <Footer>
        <Flex justify="flex-end" align="end">
          <Space>
            <Button
              onClick={() => {
                ctx.view.close();
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={async () => {
                try {
                  const values = await form.validateFields();
                  console.log('Form values:', values);
                  if (record) {
                    await ctx.resource.update(record.id, values);
                  } else {
                    await ctx.resource.create(values);
                  }
                  ctx.message.success('Record save successfully');
                  ctx.view.close();
                } catch (error) {
                  console.error('Validation failed:', error);
                }
              }}
            >
              Submit
            </Button>
          </Space>
        </Flex>
      </Footer>
    </div>
  );
};
