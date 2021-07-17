import { DatabaseOutlined } from '@ant-design/icons';
import { SchemaRenderer } from '../../../';
import Modal from 'antd/lib/modal/Modal';
import React from 'react';
import { useState } from 'react';
import schema from './schema';
import { Button, Dropdown, Menu } from 'antd';
import { useMemo } from 'react';
import { createForm } from '@formily/core';

export default () => {
  const form = useMemo(
    () =>
      createForm({
        initialValues: {
          title: '数据表名称',
        },
      }),
    [],
  );
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Button
        onClick={() => {
          setVisible(true);
        }}
        type={'primary'}
      >
        <DatabaseOutlined />
      </Button>
      <Modal
        title={
          <>
            <Dropdown
              overlay={
                <Menu
                  onClick={(info) => {
                    form.setValues({
                      title: `数据表${info.key}`,
                    });
                  }}
                >
                  <Menu.Item key={1}>数据表1</Menu.Item>
                  <Menu.Item key={2}>数据表2</Menu.Item>
                  <Menu.Divider></Menu.Divider>
                  <Menu.Item key={5}>新建数据表</Menu.Item>
                </Menu>
              }
            >
              <span style={{cursor: 'pointer'}}>数据表3</span>
            </Dropdown>
          </>
        }
        visible={visible}
        onOk={async () => {
          await form.submit();
          setVisible(false);
        }}
        onCancel={() => {
          setVisible(false);
        }}
      >
        <SchemaRenderer form={form} schema={schema} />
      </Modal>
    </>
  );
};
