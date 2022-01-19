import { Menu } from 'antd';
import React, { useState } from 'react';
import { LockOutlined } from '@ant-design/icons';
import { SchemaComponent, useActionVisible, VisibleContext } from '../schema-component';
import { ISchema, useForm } from '@formily/react';

const useCloseAction = () => {
  const { setVisible } = useActionVisible();
  const form = useForm();
  return {
    async run() {
      setVisible(false);
      form.submit((values) => {
        console.log(values);
      });
    },
  };
};

const schema: ISchema = {
  type: 'object',
  properties: {
    drawer1: {
      'x-component': 'Action.Drawer',
      type: 'void',
      title: 'Drawer Title',
      properties: {
        hello1: {
          'x-content': 'Hello',
          title: 'T1',
        },
        footer1: {
          'x-component': 'Action.Drawer.Footer',
          type: 'void',
          properties: {
            close1: {
              title: 'Close',
              'x-component': 'Action',
              'x-component-props': {
                useAction: '{{ useCloseAction }}',
              },
            },
          },
        },
      },
    },
  },
};

export const ACLAction = () => {
  const [visible, setVisible] = useState(false);
  return (
    <VisibleContext.Provider value={[visible, setVisible]}>
      <Menu.Item
        eventKey={'ACLAction'}
        onClick={() => {
          setVisible(true);
        }}
      >
        <LockOutlined />
      </Menu.Item>
      <SchemaComponent scope={{ useCloseAction }} schema={schema} />
    </VisibleContext.Provider>
  );
};
