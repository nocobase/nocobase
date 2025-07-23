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
import { Card, message } from 'antd';
import cloneDeep from 'lodash/cloneDeep';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSystemSettings } from '.';
import { i18n, useAPIClient, useRequest } from '..';
import locale from '../locale';
import { SchemaComponent, useActionContext } from '../schema-component';

const langs = Object.keys(locale).map((lang) => {
  return {
    label: `${locale[lang].label} (${lang})`,
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
  return useRequest(() => Promise.resolve(result?.data), {
    ...options,
    refreshDeps: [visible, result?.data],
  });
};

const useSaveSystemSettingsValues = () => {
  const { setVisible } = useActionContext();
  const form = useForm();
  const { mutate, data } = useSystemSettings() || {};
  const api = useAPIClient();
  const { t } = useTranslation();
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
        url: 'systemSettings:put',
        method: 'post',
        data: values,
      });
      message.success(t('Saved successfully'));
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
      'x-component': 'div',
      type: 'void',
      title: '{{t("System settings")}}',
      properties: {
        raw_title: {
          type: 'string',
          title: "{{t('System title')}}",
          'x-decorator': 'FormItem',
          'x-component': 'TextAreaWithGlobalScope',
          'x-component-props': {
            supportsLineBreak: true,
          },
          required: true,
        },
        logo: {
          type: 'string',
          title: "{{t('Logo')}}",
          'x-decorator': 'FormItem',
          'x-component': 'Upload.Attachment',
          'x-component-props': {
            action: 'attachments:create',
            multiple: false,
            // accept: 'jpg,png'
          },
          'x-use-component-props': 'useFileCollectionStorageRules',
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
        options: {
          type: 'object',
          title: '{{t("Advanced options")}}',
          properties: {
            menuDisableAccordion: {
              type: 'boolean',
              default: false,
              'x-content': '{{t("Disable Menu Accordion")}}',
              'x-component': 'Checkbox',
              'x-decorator': 'FormItem',
            },
          },
        },
        // allowSignUp: {
        //   type: 'boolean',
        //   default: true,
        //   'x-content': '{{t("Allow sign up")}}',
        //   'x-component': 'Checkbox',
        //   'x-decorator': 'FormItem',
        // },
        // smsAuthEnabled: {
        //   type: 'boolean',
        //   default: false,
        //   'x-content': '{{t("Enable SMS authentication")}}',
        //   'x-component': 'Checkbox',
        //   'x-decorator': 'FormItem',
        // },
        footer1: {
          type: 'void',
          'x-component': 'ActionBar',
          'x-component-props': {
            layout: 'one-column',
          },
          properties: {
            submit: {
              title: '{{t("Submit")}}',
              'x-component': 'Action',
              'x-component-props': {
                type: 'primary',
                htmlType: 'submit',
                useAction: '{{ useSaveSystemSettingsValues }}',
              },
            },
            // cancel: {
            //   title: 'Cancel',
            //   'x-component': 'Action',
            //   'x-component-props': {
            //     useAction: '{{ useCloseAction }}',
            //   },
            // },
          },
        },
      },
    },
  },
};

export const SystemSettingsPane = () => {
  return (
    <Card bordered={false}>
      <SchemaComponent
        scope={{ useSaveSystemSettingsValues, useSystemSettingsValues, useCloseAction }}
        schema={schema}
      />
    </Card>
  );
};
