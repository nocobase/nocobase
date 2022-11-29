import { ISchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { Menu } from 'antd';
import React, { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActionContext,
  DropdownVisibleContext,
  SchemaComponent,
  useActionContext,
  useCurrentUserContext,
  useRequest
} from '../';
import { useAPIClient } from '../api-client';

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

const useCurrentUserValues = (options) => {
  const ctx = useCurrentUserContext();
  return useRequest(() => Promise.resolve(ctx.data), options);
};

const useSaveCurrentUserValues = () => {
  const ctx = useCurrentUserContext();
  const { setVisible } = useActionContext();
  const form = useForm();
  const api = useAPIClient();
  return {
    async run() {
      const values = await form.submit<any>();
      setVisible(false);
      await api.resource('users').updateProfile({
        values,
      });
      ctx.mutate({
        data: {
          ...ctx?.data?.data,
          ...values,
        },
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
      title: '{{t("Edit profile")}}',
      properties: {
        nickname: {
          type: 'string',
          title: "{{t('Nickname')}}",
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          required: true,
        },
        email: {
          type: 'string',
          title: '{{t("Email")}}',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-validator': 'email',
          required: true,
        },
        phone: {
          type: 'string',
          title: '{{t("Phone")}}',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-validator': 'phone',
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

export const EditProfile = () => {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();
  const ctx = useContext(DropdownVisibleContext);
  return (
    <ActionContext.Provider value={{ visible, setVisible }}>
      <Menu.Item
        key="profile"
        eventKey={'EditProfile'}
        onClick={() => {
          setVisible(true);
          ctx.setVisible(false);
        }}
      >
        {t('Edit profile')}
      </Menu.Item>
      <SchemaComponent scope={{ useCurrentUserValues, useCloseAction, useSaveCurrentUserValues }} schema={schema} />
    </ActionContext.Provider>
  );
};
