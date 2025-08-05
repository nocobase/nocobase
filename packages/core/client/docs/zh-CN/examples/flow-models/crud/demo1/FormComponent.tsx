import { useFlowModelContext } from '@nocobase/flow-engine';
import { Button, Flex, Form, Input, Space } from 'antd';
import React from 'react';

export const FormComponent = (props) => {
  const { Drawer, record } = props;
  const [form] = Form.useForm();
  const ctx = useFlowModelContext();

  return (
    <div>
      <Drawer.Header title={record ? 'Edit record' : 'Add record'} />

      <Form form={form} initialValues={record} layout="vertical" colon={true}>
        <Form.Item label="Name" name="name" required>
          <Input />
        </Form.Item>
        <Form.Item label="Telephone" name="telephone" required>
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

      <Drawer.Footer>
        <Flex justify="flex-end" align="end">
          <Space>
            <Button
              onClick={() => {
                Drawer.close();
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
                  Drawer.close();
                } catch (error) {
                  console.error('Validation failed:', error);
                }
              }}
            >
              Submit
            </Button>
          </Space>
        </Flex>
      </Drawer.Footer>
    </div>
  );
};
