import { SettingOutlined } from '@ant-design/icons';
import { ISchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import React, { useState } from 'react';
import { useSystemSettings } from '.';
import { PluginManager, useAPIClient, useRequest } from '..';
import { ActionContext, SchemaComponent, useActionContext } from '../schema-component';

const useCloseAction = () => {
  const { setVisible } = useActionContext();
  // const form = useForm();
  return {
    async run() {
      setVisible(false);
    },
  };
};

const useSystemSettingsValues = (options) => {
  const result = useSystemSettings();
  return useRequest(() => Promise.resolve(result.data), {
    ...options,
  });
};

const useSaveSystemSettingsValues = () => {
  const { setVisible } = useActionContext();
  const form = useForm();
  const { mutate } = useSystemSettings();
  const api = useAPIClient();
  return {
    async run() {
      await form.submit();
      setVisible(false);
      mutate({
        data: form.values,
      });
      await api.request({
        url: 'systemSettings:update/1',
        method: 'post',
        data: form.values,
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
        useValues: '{{ useSystemSettingsValues }}',
      },
      'x-component': 'Action.Drawer',
      type: 'void',
      title: '系统设置',
      properties: {
        title: {
          type: 'string',
          title: "{{t('System title')}}",
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          required: true,
        },
        logo: {
          type: 'string',
          title: "{{t('Logo')}}",
          'x-decorator': 'FormItem',
          'x-component': 'Upload.Attachment',
          'x-component-props': {
            'action': 'attachments:upload'
            // accept: 'jpg,png'
          },
        },
        appLang: {
          type: 'string',
          title: '{{t("Language")}}',
          'x-component': 'Select',
          'x-decorator': 'FormItem',
          enum: [
            { label: 'English', value: 'en-US' },
            { label: '简体中文', value: 'zh-CN' },
          ],
        },
        allowSignUp: {
          type: 'string',
          title: '{{t("Allow sign up")}}',
          'x-component': 'Checkbox',
          'x-decorator': 'FormItem',
          default: true,
        },
        footer1: {
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
                useAction: '{{ useSaveSystemSettingsValues }}',
              },
            },
          },
        },
      },
    },
  },
};

export const SystemSettingsShortcut = () => {
  const [visible, setVisible] = useState(false);
  return (
    <ActionContext.Provider value={{ visible, setVisible }}>
      <PluginManager.Toolbar.Item
        eventKey={'ACLAction'}
        onClick={() => {
          setVisible(true);
        }}
        icon={<SettingOutlined />}
        title={'系统设置'}
      />
      <SchemaComponent
        scope={{ useSaveSystemSettingsValues, useSystemSettingsValues, useCloseAction }}
        schema={schema}
      />
    </ActionContext.Provider>
  );
};
