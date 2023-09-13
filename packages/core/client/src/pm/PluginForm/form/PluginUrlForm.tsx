import { ISchema } from '@formily/json-schema';
import { useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { App } from 'antd';
import React, { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useAPIClient, useRequest } from '../../../api-client';
import { SchemaComponent } from '../../../schema-component';
import { IPluginData } from '../../types';

interface IPluginUrlFormProps {
  onClose: (refresh?: boolean) => void;
  isUpgrade?: boolean;
  pluginData?: IPluginData;
}

export const PluginUrlForm: FC<IPluginUrlFormProps> = ({ onClose, pluginData, isUpgrade }) => {
  const { message } = App.useApp();
  const useSaveValues = () => {
    const api = useAPIClient();
    const { t } = useTranslation();
    const form = useForm();

    return {
      async run() {
        const compressedFileUrl = form.values.compressedFileUrl;
        if (!compressedFileUrl) return;
        await form.submit();
        const data = {
          compressedFileUrl,
        };
        if (pluginData?.packageName) {
          data['packageName'] = pluginData.packageName;
        }
        api.request({
          url: `pm:${isUpgrade ? 'update' : 'add'}`,
          method: 'post',
          data,
        });
        onClose(true);
      },
    };
  };

  const useValuesFromProps = (options) => {
    return useRequest(
      () =>
        Promise.resolve({
          data: { compressedFileUrl: pluginData.compressedFileUrl },
        }),
      options,
    );
  };

  const useCancel = () => {
    return {
      run() {
        onClose();
      },
    };
  };

  const schema = useMemo<ISchema>(() => {
    return {
      type: 'object',
      properties: {
        [uid()]: {
          'x-decorator': 'Form',
          'x-component': 'div',
          type: 'void',
          'x-decorator-props': {
            useValues: '{{ useValuesFromProps }}',
          },
          properties: {
            compressedFileUrl: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'Input',
              required: true,
            },
            footer: {
              type: 'void',
              'x-component': 'ActionBar',
              'x-component-props': {
                layout: 'one-column',
                style: {
                  justifyContent: 'right',
                },
              },
              properties: {
                cancel: {
                  title: 'Cancel',
                  'x-component': 'Action',
                  'x-component-props': {
                    useAction: '{{ useCancel }}',
                  },
                },
                submit: {
                  title: '{{t("Submit")}}',
                  'x-component': 'Action',
                  'x-component-props': {
                    type: 'primary',
                    htmlType: 'submit',
                    useAction: '{{ useSaveValues }}',
                  },
                },
              },
            },
          },
        },
      },
    };
  }, []);

  return <SchemaComponent scope={{ useCancel, useValuesFromProps, useSaveValues }} schema={schema} />;
};
