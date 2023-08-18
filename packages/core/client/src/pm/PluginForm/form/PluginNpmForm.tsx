import { App } from 'antd';
import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ISchema } from '@formily/json-schema';
import { uid } from '@formily/shared';
import { useForm } from '@formily/react';

import { useAPIClient } from '../../../api-client';
import { SchemaComponent } from '../../../schema-component';

const schema: ISchema = {
  type: 'object',
  properties: {
    [uid()]: {
      'x-decorator': 'Form',
      'x-component': 'div',
      type: 'void',
      properties: {
        registry: {
          type: 'string',
          title: "{{t('Registry url')}}",
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          required: true,
          'x-decorator-props': {
            help: 'Example: https://registry.npmjs.org/',
          },
        },
        packageName: {
          type: 'string',
          title: "{{t('Npm package name')}}",
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          required: true,
        },
        authToken: {
          type: 'string',
          title: "{{t('Npm authToken')}}",
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
        footer: {
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
                useAction: '{{ useSaveValues }}',
              },
            },
            cancel: {
              title: 'Cancel',
              'x-component': 'Action',
              'x-component-props': {
                useAction: '{{ useCancel }}',
              },
            },
          },
        },
      },
    },
  },
};

interface IPluginNpmFormProps {
  onClose: (refresh?: boolean) => void;
}

export const PluginNpmForm: FC<IPluginNpmFormProps> = ({ onClose }) => {
  const { message } = App.useApp();
  const useSaveValues = () => {
    const api = useAPIClient();
    const { t } = useTranslation();
    const form = useForm();

    return {
      async run() {
        await form.submit();
        await api.request({
          url: 'pm:addByNpm',
          method: 'post',
          data: {
            ...form.values,
            type: 'npm',
          },
        });
        message.success(t('Saved successfully'), 2, () => {
          onClose(true);
        });
      },
    };
  };

  const useCancel = () => {
    return {
      run() {
        onClose();
      },
    };
  };

  return <SchemaComponent scope={{ useCancel, useSaveValues }} schema={schema} />;
};
