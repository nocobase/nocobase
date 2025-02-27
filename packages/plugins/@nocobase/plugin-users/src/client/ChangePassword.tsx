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
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import React, { useContext, useEffect, useMemo, useState, useCallback } from 'react';
import {
  ActionContextProvider,
  DropdownVisibleContext,
  SchemaComponent,
  useActionContext,
  useSystemSettings,
  zIndexContext,
  useZIndexContext,
  SchemaComponentContext,
  useAPIClient,
  SchemaSettingsItem,
} from '@nocobase/client';

const useCloseAction = () => {
  const { setVisible } = useActionContext();
  const form = useForm();
  return {
    async run() {
      setVisible(false);
      await form.reset();
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
      'x-component-props': {
        zIndex: 2000,
      },
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
          'x-validator': { password: true },
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

export const ChangePassword = () => {
  const ctx = useContext(DropdownVisibleContext);
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();
  const { data } = useSystemSettings() || {};
  const { enableChangePassword } = data?.data || {};
  const parentZIndex = useZIndexContext();
  const zIndex = parentZIndex + 10;

  // 避免重复渲染的 click 处理
  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      ctx?.setVisible?.(false);
      setVisible((prev) => (prev ? prev : true)); // 只有 `visible` 变化时才触发更新
    },
    [ctx],
  );

  const schemaComponent = useMemo(() => {
    return (
      <SchemaComponentContext.Provider value={{ designable: false }}>
        <SchemaComponent scope={{ useCloseAction, useSaveCurrentUserValues }} schema={schema} />
      </SchemaComponentContext.Provider>
    );
  }, [zIndex]);

  if (enableChangePassword === false) {
    return null;
  }
  return (
    <zIndexContext.Provider value={zIndex}>
      <SchemaSettingsItem eventKey="changePassword" title="changePassword">
        <div onClick={handleClick}>{t('Change password')}</div>
      </SchemaSettingsItem>
      <ActionContextProvider value={{ visible, setVisible }}>
        {visible && <div onClick={(e) => e.stopPropagation()}>{schemaComponent}</div>}
      </ActionContextProvider>
    </zIndexContext.Provider>
  );
};
