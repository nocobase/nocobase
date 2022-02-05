import { ISchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { Menu } from 'antd';
import React, { useState } from 'react';
import { SchemaComponent, useActionVisible, useRequest, VisibleContext } from '../';

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

const useCurrentUserValues = (props, options) => {
  return useRequest(
    () =>
      Promise.resolve({
        data: {},
      }),
    {
      ...options,
    },
  );
};

const useSaveCurrentUserValues = () => {
  const { setVisible } = useActionVisible();
  const form = useForm();
  return {
    async run() {
      form.submit((values) => {
        setVisible(false);
        console.log(values);
      });
    },
  };
};

const schema: ISchema = {
  type: 'object',
  properties: {
    [uid()]: {
      'x-decorator': 'Form',
      'x-decorator-props': {
        useValues: '{{ useCurrentUserValues }}',
      },
      'x-component': 'Action.Drawer',
      type: 'void',
      title: '个人资料',
      properties: {
        nickname: {
          type: 'string',
          title: "{{t('Nickname')}}",
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          required: true,
        },
        footer: {
          'x-component': 'Action.Drawer.Footer',
          type: 'void',
          properties: {
            cancel: {
              title: 'Cancel',
              'x-component': 'Action',
              'x-component-props': {
                useAction: '{{ useCloseAction }}',
              },
            },
            submit: {
              title: 'Submit',
              'x-component': 'Action',
              'x-component-props': {
                type: 'primary',
                useAction: '{{ useSaveCurrentUserValues }}',
              },
            },
          },
        },
      },
    },
  },
};

export const ProfileAction = () => {
  const [visible, setVisible] = useState(false);
  return (
    <VisibleContext.Provider value={[visible, setVisible]}>
      <Menu.Item
        eventKey={'ProfileAction'}
        onClick={() => {
          setVisible(true);
        }}
      >
        个人资料
      </Menu.Item>
      <SchemaComponent scope={{ useCurrentUserValues, useCloseAction, useSaveCurrentUserValues }} schema={schema} />
    </VisibleContext.Provider>
  );
};
