import { ISchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { Menu } from 'antd';
import React, { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActionContext, SchemaComponent, useActionContext } from '../';
import { useAPIClient } from '../api-client';
import { DropdownVisibleContext } from './CurrentUser';

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

const useSaveCurrentUserValues = () => {
  const { setVisible } = useActionContext();
  const form = useForm();
  const api = useAPIClient();
  return {
    async run() {
      await form.submit();
      await api.resource('users').changePassword({
        values: form.values,
      });
      setVisible(false);
    },
  };
};

const schema: ISchema = {
  type: 'object',
  properties: {
    [uid()]: {
      'x-decorator': 'Form',
      'x-component': 'Action.Drawer',
      type: 'void',
      title: '修改密码',
      properties: {
        oldPassword: {
          type: 'string',
          title: '{{t("Old Password")}}',
          required: true,
          'x-component': 'Password',
          'x-decorator': 'FormItem',
        },
        newPassword: {
          type: 'string',
          title: '{{t("New Password")}}',
          required: true,
          'x-component': 'Password',
          'x-decorator': 'FormItem',
          'x-component-props': { placeholder: '{{t("New Password")}}', checkStrength: true, style: {} },
          'x-reactions': [
            {
              dependencies: ['.confirmPassword'],
              fulfill: {
                state: {
                  selfErrors: '{{$deps[0] && $self.value && $self.value !== $deps[0] ? t("Password mismatch") : ""}}',
                },
              },
            },
          ],
        },
        confirmPassword: {
          type: 'string',
          required: true,
          title: '{{t("Confirm Password")}}',
          'x-component': 'Password',
          'x-decorator': 'FormItem',
          'x-component-props': { placeholder: '{{t("Confirm password")}}', checkStrength: true, style: {} },
          'x-reactions': [
            {
              dependencies: ['.newPassword'],
              fulfill: {
                state: {
                  selfErrors: '{{$deps[0] && $self.value && $self.value !== $deps[0] ? t("Password mismatch") : ""}}',
                },
              },
            },
          ],
        },
        footer: {
          'x-component': 'Action.Drawer.Footer',
          type: 'void',
          properties: {
            cancel: {
              title: '{{t("Cancel")}}',
              'x-component': 'Action',
              'x-component-props': {
                useAction: '{{ useCloseAction }}',
              },
            },
            submit: {
              title: '{{t("Submit")}}',
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

export const ChangePassword = () => {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();
  const ctx = useContext(DropdownVisibleContext);
  return (
    <ActionContext.Provider value={{ visible, setVisible }}>
      <Menu.Item
        eventKey={'ChangePassword'}
        onClick={() => {
          ctx?.setVisible?.(false);
          setVisible(true);
        }}
      >
        {t('Change password')}
      </Menu.Item>
      <SchemaComponent scope={{ useCloseAction, useSaveCurrentUserValues }} schema={schema} />
    </ActionContext.Provider>
  );
};
