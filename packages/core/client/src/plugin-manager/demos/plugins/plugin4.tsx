import { VerifiedOutlined } from '@ant-design/icons';
import { ISchema, useForm } from '@formily/react';
import { ActionContext, PluginManager, SchemaComponent, useActionContext } from '@nocobase/client';
import React, { useState } from 'react';

const useCloseAction = () => {
  const { setVisible } = useActionContext();
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

export const Plugin4 = () => null;

Plugin4.ToolbarItem = () => {
  const [visible, setVisible] = useState(false);
  return (
    <ActionContext.Provider value={{ visible, setVisible }}>
      <PluginManager.Toolbar.Item
        icon={<VerifiedOutlined />}
        title={'Plugin4'}
        onClick={() => {
          setVisible(true);
        }}
      />
      <SchemaComponent scope={{ useCloseAction }} schema={schema} />
    </ActionContext.Provider>
  );
};
