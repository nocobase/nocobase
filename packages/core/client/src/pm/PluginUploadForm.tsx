import { App, Modal } from 'antd';
import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaComponent } from '../schema-component';
import { ISchema } from '@formily/json-schema';
import { uid } from '@formily/shared';
import { useForm } from '@formily/react';
import { useAPIClient } from '../api-client';

const schema: ISchema = {
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
            tipContent: `{{t('Upload placeholder')}}`,
          },
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

interface IPluginUploadFormProps {
  onClose: (refresh?: boolean) => void;
  name: string;
  isShow: boolean;
}

export const PluginUploadForm: FC<IPluginUploadFormProps> = ({ onClose, name, isShow }) => {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const useSaveValues = () => {
    const api = useAPIClient();
    const { t } = useTranslation();
    const form = useForm();

    return {
      async run() {
        await form.submit();
        await api.request({
          url: `pm:upgradeByCompressedFileUrl/${name}`,
          method: 'post',
          data: {
            compressedFileUrl: form.values.uploadFile[0].response.data.url,
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

  return (
    <Modal open={isShow} onCancel={() => onClose()} footer={null} destroyOnClose title={t('Upload plugin')} width={580}>
      <SchemaComponent scope={{ useCancel, useSaveValues }} schema={schema} />
    </Modal>
  );
};
