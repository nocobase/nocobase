import { Switch } from '@formily/antd-v5';
import { ISchema, useForm } from '@formily/react';
import { action } from '@formily/reactive';
import { uid } from '@formily/shared';
import {
  Action,
  Checkbox,
  Cron,
  Form,
  FormItem,
  Input,
  SchemaComponent,
  Select,
  useActionContext,
  useAPIClient,
  useRequest,
} from '@nocobase/client';
import { App, Card, Input as AntdInput } from 'antd';
import cloneDeep from 'lodash/cloneDeep';
import React from 'react';
import { useT } from '../locale';

interface BackupSettings {
  storage?: string;
  password?: string;
  enableFilesBackup: boolean;
  keep: number;
  scheduled: boolean;
  cron: string;
}

const useBackupSettingsValues = (options) => {
  const { visible } = useActionContext();
  return useRequest(
    {
      url: 'backupSettings:get/1',
    },
    {
      ...options,
      refreshDeps: [visible],
    },
  );
};

const useSaveBackupSettingsValues = () => {
  const { setVisible } = useActionContext();
  const form = useForm();
  const api = useAPIClient();
  const { message } = App.useApp();
  const t = useT();
  const { data, mutate } = useRequest<{ data: BackupSettings }>({
    url: 'backupSettings:get/1',
  });

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
        url: 'backupSettings:update/1',
        method: 'post',
        data: values,
      });
      message.success(t('Saved successfully'));
      setVisible(false);
    },
  };
};

const schema: ISchema = {
  type: 'object',
  properties: {
    [uid()]: {
      'x-decorator': 'Form',
      'x-decorator-props': {
        useValues: '{{ useBackupSettingsValues }}',
      },
      'x-component': 'div',
      type: 'void',
      properties: {
        setCron: {
          type: 'void',
          title: '{{t("Automatic backup")}}',
          'x-component': 'FormItem',
          'x-component-props': {
            // layout: 'inline',
          },
          properties: {
            scheduled: {
              required: true,
              type: 'boolean',
              'x-component': 'Checkbox',
              'x-component-props': {
                children: '{{t("Run automatic backup on the cron schedule")}}',
              },
            },
            cron: {
              type: 'string',
              'x-component': 'Cron',
              'x-component-props': {
                clearButton: false,
                defaultValue: '0 0 * * *',
                disabled: '{{!$values.scheduled}}',
              },
            },
          },
        },
        keep: {
          required: true,
          type: 'number',
          title: '{{t("Maximum number of backups")}}',
          description: '{{t("The maximum number of backups to keep, older backups are automatically deleted.")}}',
          'x-decorator': 'FormItem',
          'x-component': 'InputNumber',
          'x-component-props': {
            min: 1,
          },
        },
        storageId: {
          type: 'string',
          title: '{{t("Sync backups to cloud storage")}}',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          'x-reactions': ['{{useAsyncDataSource()}}'],
        },
        enableFilesBackup: {
          type: 'boolean',
          title: '{{t("Backup local storage files")}}',
          'x-decorator': 'FormItem',
          'x-component': Switch,
          // 'x-component-props': {
          //   children: '{{t("Backup local storage files")}}',
          // },
        },
        encryptionPassword: {
          type: 'string',
          title: '{{t("Restore password")}}',
          description: '{{t("If a restore password is set, it must be entered when restoring the backup.")}}',
          'x-decorator': 'FormItem',
          'x-component': AntdInput.Password,
          'x-component-props': {
            autoComplete: 'new-password',
          },
        },
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
                useAction: '{{ useSaveBackupSettingsValues }}',
              },
            },
          },
        },
      },
    },
  },
};

export const BackupSettings = () => {
  const api = useAPIClient();
  const t = useT();
  const useAsyncDataSource = () => (field) => {
    field.loading = true;
    api.request({ url: 'storages:list' }).then(
      action.bound((res) => {
        const result = res?.data?.data || [];
        field.dataSource = result
          .filter((item) => item.type !== 'local')
          .map((item) => {
            return {
              label: item.title,
              value: item.id,
            };
          });
        field.loading = false;
      }),
    );
  };

  return (
    <Card bordered={false}>
      <SchemaComponent
        scope={{ useSaveBackupSettingsValues, useBackupSettingsValues, useAsyncDataSource, t }}
        schema={schema}
        components={{
          // This Cron component will produce some react warning, and it has already been fixed in the latest version
          // As the author said, this is not a bug, but a warning, and it will not affect the use of the component
          // check: https://github.com/xrutayisire/react-js-cron/issues/60
          // and    https://github.com/xrutayisire/react-js-cron/issues/55
          Cron,
          Action,
          Form,
          Input,
          FormItem,
          Select,
          Checkbox,
        }}
      />
    </Card>
  );
};
