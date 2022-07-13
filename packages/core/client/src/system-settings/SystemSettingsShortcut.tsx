import { SettingOutlined } from '@ant-design/icons';
import { ISchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import cloneDeep from 'lodash/cloneDeep';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSystemSettings } from '.';
import { i18n, PluginManager, useAPIClient, useRequest } from '..';
import locale from '../locale';
import { ActionContext, SchemaComponent, useActionContext } from '../schema-component';

const langs = Object.keys(locale).map((lang) => {
  return {
    label: locale[lang].label,
    value: lang,
  };
});

const useCloseAction = () => {
  const { setVisible } = useActionContext();
  return {
    async run() {
      setVisible(false);
    },
  };
};

const useSystemSettingsValues = (options) => {
  const { visible } = useActionContext();
  const result = useSystemSettings();
  return useRequest(() => Promise.resolve(result.data), {
    ...options,
    refreshDeps: [visible],
  });
};

const useSaveSystemSettingsValues = () => {
  const { setVisible } = useActionContext();
  const form = useForm();
  const { mutate, data } = useSystemSettings();
  const api = useAPIClient();
  return {
    async run() {
      await form.submit();
      const values = cloneDeep(form.values);
      mutate({
        data: {
          ...data?.data,
          ...values,
        },
      });
      await api.request({
        url: 'systemSettings:update/1',
        method: 'post',
        data: values,
      });
      const lang = values.enabledLanguages?.[0] || 'en-US';
      if (values.enabledLanguages.length < 2 && api.auth.getLocale() !== lang) {
        api.auth.setLocale('');
        window.location.reload();
      } else {
        setVisible(false);
      }
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
      title: '{{t("System settings")}}',
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
            action: 'attachments:upload',
            multiple: false,
            // accept: 'jpg,png'
          },
        },
        enabledLanguages: {
          type: 'array',
          title: '{{t("Enabled languages")}}',
          'x-component': 'Select',
          'x-component-props': {
            mode: 'multiple',
          },
          'x-decorator': 'FormItem',
          enum: langs,
          'x-reactions': (field) => {
            field.dataSource = langs.map((item) => {
              let label = item.label;
              if (field.value?.[0] === item.value) {
                label += `(${i18n.t('Default')})`;
              }
              return {
                label,
                value: item.value,
              };
            });
          },
        },
        allowSignUp: {
          type: 'boolean',
          default: true,
          'x-content': '{{t("Allow sign up")}}',
          'x-component': 'Checkbox',
          'x-decorator': 'FormItem',
        },
        footer1: {
          type: 'void',
          'x-component': 'Action.Drawer.Footer',
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
                htmlType: 'submit',
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
  const { t } = useTranslation();
  return (
    <ActionContext.Provider value={{ visible, setVisible }}>
      <PluginManager.Toolbar.Item
        eventKey={'ACLAction'}
        onClick={() => {
          setVisible(true);
        }}
        icon={<SettingOutlined />}
        title={t('System settings')}
      />
      <SchemaComponent
        scope={{ useSaveSystemSettingsValues, useSystemSettingsValues, useCloseAction }}
        schema={schema}
      />
    </ActionContext.Provider>
  );
};
