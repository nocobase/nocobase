/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { MenuProps } from 'antd';
import React, { useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActionContextProvider, DropdownVisibleContext, SchemaComponent, useActionContext } from '../';
import { useAPIClient } from '../api-client';
import { useNavigate } from 'react-router-dom';
import { useSystemSettings } from '../';

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
  const navigate = useNavigate();
  const { setVisible } = useActionContext();
  const form = useForm();
  const api = useAPIClient();
  return {
    async run() {
      await form.submit();
      await api.resource('auth').changePassword({
        values: form.values,
      });
      await form.reset();
      setVisible(false);
      navigate('/signin');
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
      title: '{{t("Change password")}}',
      properties: {
        oldPassword: {
          type: 'string',
          title: '{{t("Old password")}}',
          required: true,
          'x-component': 'Password',
          'x-decorator': 'FormItem',
        },
        newPassword: {
          type: 'string',
          title: '{{t("New password")}}',
          required: true,
          'x-component': 'Password',
          'x-decorator': 'FormItem',
          'x-component-props': { checkStrength: true, style: {} },
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
          title: '{{t("Confirm password")}}',
          'x-component': 'Password',
          'x-decorator': 'FormItem',
          'x-component-props': { checkStrength: true, style: {} },
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

export const useChangePassword = () => {
  const ctx = useContext(DropdownVisibleContext);
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();
  const { data } = useSystemSettings();
  const { enableChangePassword } = data?.data || {};

  const result = useMemo<MenuProps['items'][0]>(() => {
    return {
      key: 'password',
      eventKey: 'ChangePassword',
      onClick: () => {
        setVisible(true);
        ctx?.setVisible(false);
      },
      label: (
        <>
          {t('Change password')}
          <ActionContextProvider value={{ visible, setVisible }}>
            <div onClick={(e) => e.stopPropagation()}>
              <SchemaComponent scope={{ useCloseAction, useSaveCurrentUserValues }} schema={schema} />
            </div>
          </ActionContextProvider>
        </>
      ),
    };
  }, [visible]);
  if (enableChangePassword === false) {
    return null;
  }

  return result;
};
