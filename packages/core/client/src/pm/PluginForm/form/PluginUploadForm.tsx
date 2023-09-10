import { ISchema } from '@formily/json-schema';
import { useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { App } from 'antd';
import type { RcFile } from 'antd/es/upload';
import React, { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useAPIClient } from '../../../api-client';
import { SchemaComponent } from '../../../schema-component';
import { IPluginData } from '../../types';

interface IPluginUploadFormProps {
  onClose: (refresh?: boolean) => void;
  isUpgrade: boolean;
  pluginData?: IPluginData;
}

export const PluginUploadForm: FC<IPluginUploadFormProps> = ({ onClose, pluginData, isUpgrade }) => {
  const { message } = App.useApp();
  const useSaveValues = () => {
    const api = useAPIClient();
    const { t } = useTranslation();
    const form = useForm();

    return {
      async run() {
        if (!form.values.uploadFile[0]?.response?.data?.url) return;
        let compressedFileUrl = form.values.uploadFile[0].response.data.url;
        if (!compressedFileUrl) return;
        if (!(compressedFileUrl.startsWith('http') || compressedFileUrl.startsWith('//'))) {
          if (!compressedFileUrl.startsWith('/')) {
            compressedFileUrl = `/${compressedFileUrl}`;
          }
          compressedFileUrl = `${window.origin}${compressedFileUrl}`;
        }
        await form.submit();
        const data = {
          compressedFileUrl,
        };
        if (pluginData?.name) {
          data['name'] = pluginData.name;
        }
        await api.request({
          url: `pm:${isUpgrade ? 'upgradeByCompressedFileUrl' : 'addByCompressedFileUrl'}`,
          method: 'post',
          data,
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

  const schema = useMemo<ISchema>(() => {
    return {
      type: 'object',
      properties: {
        [uid()]: {
          'x-decorator': 'Form',
          'x-component': 'div',
          type: 'void',
          properties: {
            uploadFile: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'Upload.Dragger',
              required: true,
              'x-component-props': {
                action: 'attachments:create',
                multiple: false,
                maxCount: 1,
                height: '150px',
                tipContent: `{{t('Drag and drop the file here or click to upload, file size should not exceed 30M')}}`,
                beforeUpload: (file: RcFile) => {
                  const compressedFileRegex = /\.(zip|rar|tar|gz|bz2|tgz)$/;
                  const isCompressedFile = compressedFileRegex.test(file.name);
                  if (!isCompressedFile) {
                    message.error('File only support zip, rar, tar, gz, bz2!');
                  }

                  const fileSizeLimit = file.size / 1024 / 1024 < 30;
                  if (!fileSizeLimit) {
                    message.error('File must smaller than 30MB!');
                  }
                  return isCompressedFile && fileSizeLimit;
                },
              },
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
  }, [message]);

  return <SchemaComponent scope={{ useCancel, useSaveValues }} schema={schema} />;
};
