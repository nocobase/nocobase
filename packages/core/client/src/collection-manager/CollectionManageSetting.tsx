import { ISchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { Card, message } from 'antd';
import cloneDeep from 'lodash/cloneDeep';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCollectionManageSetting, CollectionManageSettingProvider } from './CollectionManageSettingProvider';
import { useAPIClient, useRequest } from '..';
import { SchemaComponent, useActionContext } from '../schema-component';

const useSystemSettingsValues = (options) => {
  const { visible } = useActionContext();
  const result = useCollectionManageSetting();
  return useRequest(() => Promise.resolve(result.data), {
    ...options,
    refreshDeps: [visible],
  });
};

const useSaveSystemSettingsValues = () => {
  const form = useForm();
  const api = useAPIClient();
  const { t } = useTranslation();
  return {
    async run() {
      await form.submit();
      const values = cloneDeep(form.values);
      localStorage.setItem('RANDOM_UID_BLACKLIST', values?.options?.randomUidBlacklist);
      await api.request({
        url: 'applicationPlugins:update',
        method: 'post',
        data: values,
        params: {
          filterByTk: 2,
        },
      });
      message.success(t('Saved successfully'));
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
        'options.randomUidBlacklist': {
          type: 'string',
          title: '{{t("auto generate uid")}}',
          'x-component': 'Checkbox.Group',
          'x-component-props': {
            options: [
              { label: '{{t("Table name")}}', value: 'TABLE_NAME' },
              { label: '{{t("Table field name")}}', value: 'TABLE_FIELD' },
              { label: '{{t("Foreign key")}}', value: 'FOREIGN_KEY' },
              { label: '{{t("Table select option")}}', value: 'SELECT_OPTION' },
            ],
          },
          'x-decorator': 'FormItem',
          'x-decorator-props': {
            tooltip: '{{t("auto generate uid switch")}}',
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
                useAction: '{{ useSaveSystemSettingsValues }}',
              },
            },
          },
        },
      },
    },
  },
};

export const CollectionManageSetting = () => {
  return (
    <Card bordered={false}>
      <CollectionManageSettingProvider>
        <SchemaComponent scope={{ useSaveSystemSettingsValues, useSystemSettingsValues }} schema={schema} />
      </CollectionManageSettingProvider>
    </Card>
  );
};
