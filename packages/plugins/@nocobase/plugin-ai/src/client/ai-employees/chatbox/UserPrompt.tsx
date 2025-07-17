/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { SchemaComponent, useAPIClient, useActionContext, useToken } from '@nocobase/client';
import { useT } from '../../locale';
import { Button, Popover, Card, Alert, App, Typography } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useForm } from '@formily/react';
import { useAIEmployeesContext } from '../AIEmployeesProvider';
import { uid } from '@formily/shared';
import { useChatBoxStore } from './stores/chat-box';

const useCancelActionProps = () => {
  const { setVisible } = useActionContext();
  const form = useForm();
  return {
    type: 'default',
    onClick() {
      setVisible(false);
      form.reset();
    },
  };
};

const useEditActionProps = () => {
  const { setVisible } = useActionContext();
  const { message } = App.useApp();
  const form = useForm();
  const api = useAPIClient();
  const t = useT();

  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const setCurrentEmployee = useChatBoxStore.use.setCurrentEmployee();

  const {
    service: { refresh },
  } = useAIEmployeesContext();

  return {
    type: 'primary',
    async onClick() {
      await form.submit();
      await api.resource('aiEmployees').updateUserPrompt({
        values: {
          aiEmployee: currentEmployee.username,
          prompt: form.values?.prompt,
        },
      });
      refresh();
      setCurrentEmployee((prev) => ({
        ...prev,
        userConfig: {
          ...prev.userConfig,
          prompt: form.values?.prompt,
        },
      }));
      message.success(t('Saved successfully'));
      setVisible(false);
      form.reset();
    },
  };
};

const Edit: React.FC = () => {
  const t = useT();
  const currentEmployee = useChatBoxStore.use.currentEmployee();

  return (
    <SchemaComponent
      scope={{ useCancelActionProps, useEditActionProps }}
      schema={{
        type: 'void',
        name: uid(),
        'x-component': 'Action',
        title: '{{t("Edit")}}',
        'x-component-props': {
          variant: 'link',
          color: 'primary',
        },
        properties: {
          modal: {
            type: 'void',
            'x-component': 'Action.Modal',
            'x-component-props': {
              styles: {
                wrapper: {
                  zIndex: 1000,
                },
                mask: {
                  zIndex: 1000,
                },
              },
            },
            title: t('Edit personalized prompt'),
            'x-decorator': 'FormV2',
            'x-decorator-props': 'useEditFormProps',
            properties: {
              prompt: {
                type: 'string',
                title: t('Personalized prompt'),
                'x-decorator': 'FormItem',
                'x-component': 'Input.TextArea',
                default: currentEmployee?.userConfig?.prompt,
              },
              footer: {
                type: 'void',
                'x-component': 'Action.Modal.Footer',
                properties: {
                  close: {
                    title: t('Cancel'),
                    'x-component': 'Action',
                    'x-use-component-props': 'useCancelActionProps',
                  },
                  submit: {
                    title: t('Submit'),
                    'x-component': 'Action',
                    'x-use-component-props': 'useEditActionProps',
                  },
                },
              },
            },
          },
        },
      }}
    />
  );
};

export const UserPrompt: React.FC = () => {
  const t = useT();
  const { token } = useToken();
  const currentEmployee = useChatBoxStore.use.currentEmployee();

  return (
    <Popover
      styles={{
        body: {
          padding: 0,
          marginRight: '8px',
        },
      }}
      arrow={false}
      content={
        <Card
          styles={{
            body: {
              width: '400px',
            },
          }}
          variant="borderless"
          size="small"
          title={
            <div
              style={{
                fontWeight: 500,
                fontSize: token.fontSize,
              }}
            >
              {t('Personalized prompt')}
            </div>
          }
          extra={<Edit />}
        >
          {currentEmployee?.userConfig?.prompt ? (
            <div
              style={{
                whiteSpace: 'pre-wrap',
              }}
            >
              {currentEmployee.userConfig.prompt}
            </div>
          ) : (
            <Alert message={t('Personalized prompt description')} type="info" />
          )}
        </Card>
      }
    >
      <Button icon={<InfoCircleOutlined />} type="text" />
    </Popover>
  );
};
