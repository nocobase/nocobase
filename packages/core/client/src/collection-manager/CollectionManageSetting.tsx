import { ISchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { Card, message } from 'antd';
import cloneDeep from 'lodash/cloneDeep';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  useCollectionManageSetting,
  CollectionManageSettingProvider,
  ERandomUidType,
  CONSTANT,
} from './CollectionManageSettingProvider';
import { useAPIClient, useRequest } from '..';
import { SchemaComponent, useActionContext } from '../schema-component';

const useSettingsValues = (options) => {
  const { visible } = useActionContext();
  const result = useCollectionManageSetting();
  return useRequest(() => Promise.resolve(result?.data), {
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
      localStorage.setItem(CONSTANT.RANDOM_UID_BLACKLIST, values?.options?.randomUidBlacklist);
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
        useValues: '{{ useSettingsValues }}',
      },
      'x-component': 'div',
      type: 'void',
      title: '{{t("System settings")}}',
      properties: {
        'options.randomUidBlacklist': {
          type: 'string',
          title: '{{t("Do not generate related identifiers randomly")}}',
          'x-component': 'Checkbox.Group',
          'x-component-props': {
            options: [
              { label: '{{t("Collection name")}}', value: ERandomUidType.TABLE_NAME },
              { label: '{{t("Collection field name")}}', value: ERandomUidType.TABLE_FIELD },
              { label: '{{t("Association fields foreign key")}}', value: ERandomUidType.FOREIGN_KEY },
              { label: '{{t("Option value for choice-type fields")}}', value: ERandomUidType.SELECT_OPTION },
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
        <SchemaComponent scope={{ useSaveSystemSettingsValues, useSettingsValues }} schema={schema} />
      </CollectionManageSettingProvider>
    </Card>
  );
};
