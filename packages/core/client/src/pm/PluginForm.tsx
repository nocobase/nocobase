import { App, Form, Modal, Radio } from 'antd';
import React, { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaComponent } from '../schema-component';
import { ISchema } from '@formily/json-schema';
import { uid } from '@formily/shared';
import { useStyles } from './style';
import { useForm } from '@formily/react';
import { useAPIClient } from '../api-client';

const footer = {
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
};

const npmSchema: ISchema = {
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
        footer,
      },
    },
  },
};

const uploadSchema: ISchema = {
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
            tipContent: `{{t('Drag and drop the file here or click to upload, file size should not exceed 10M')}}`,
          },
        },
        footer,
      },
    },
  },
};

const compressedFileUrlSchema: ISchema = {
  type: 'object',
  properties: {
    [uid()]: {
      'x-decorator': 'Form',
      'x-component': 'div',
      type: 'void',
      properties: {
        compressedFileUrl: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          required: true,
        },
        footer,
      },
    },
  },
};

const schema = {
  npm: npmSchema,
  upload: uploadSchema,
  url: compressedFileUrlSchema,
};

interface IPluginFormProps {
  onClose: (refresh?: boolean) => void;
  isShow: boolean;
}

export const PluginForm: FC<IPluginFormProps> = ({ onClose, isShow }) => {
  const { t } = useTranslation();
  const [type, setType] = useState<'npm' | 'upload' | 'url'>('npm');
  const { theme } = useStyles();
  const { message } = App.useApp();
  const useSaveValues = () => {
    const api = useAPIClient();
    const { t } = useTranslation();
    const form = useForm();

    return {
      async run() {
        await form.submit();
        if (type === 'npm') {
          await api.request({
            url: 'pm:addByNpm',
            method: 'post',
            data: form.values,
          });
        } else {
          let compressedFileUrl =
            type === 'url' ? form.values.compressedFileUrl : form.values.uploadFile[0].response.data.url;

          if (!(compressedFileUrl.startsWith('http') || compressedFileUrl.startsWith('//'))) {
            if (!compressedFileUrl.startsWith('/')) {
              compressedFileUrl = `/${compressedFileUrl}`;
            }
            compressedFileUrl = `${window.origin}${compressedFileUrl}`;
          }

          await api.request({
            url: 'pm:addByCompressedFileUrl',
            method: 'post',
            data: {
              compressedFileUrl,
              type,
            },
          });
        }
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
    <Modal onCancel={() => onClose()} footer={null} destroyOnClose title={t('New plugin')} width={580} open={isShow}>
      <label style={{ fontWeight: 'bold' }}>{t('Add type')}:</label>
      <Radio.Group style={{ margin: theme.margin }} defaultValue={type} onChange={(e) => setType(e.target.value)}>
        <Radio value="npm">{t('Npm package')}</Radio>
        <Radio value="upload">{t('Upload plugin')}</Radio>
        <Radio value="url">{t('Compressed file url')}</Radio>
      </Radio.Group>

      <SchemaComponent scope={{ useCancel, useSaveValues }} schema={schema[type]} />
    </Modal>
  );
};
