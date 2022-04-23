import { onFieldChange } from '@formily/core';
import { message } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient, useRequest } from '../../api-client';
import { useRecord } from '../../record-provider';
import { SchemaComponent } from '../../schema-component';

export const RoleConfigure = () => {
  const api = useAPIClient();
  const record = useRecord();
  const { t } = useTranslation();
  return (
    <SchemaComponent
      schema={{
        type: 'void',
        name: 'form',
        'x-component': 'Form',
        'x-component-props': {
          useValues: (options) => {
            return useRequest(
              {
                resource: 'roles',
                action: 'get',
                params: {
                  filterByTk: record.name,
                },
              },
              options,
            );
          },
          effects() {
            onFieldChange('*', async (field, form) => {
              if (!form.modified) {
                return;
              }
              await api.resource('roles').update({
                filterByTk: record.name,
                values: form.values,
              });
              message.success(t('Saved successfully'));
            });
          },
        },
        properties: {
          allowConfigure: {
            title: t('Configure permissions'),
            'x-decorator': 'FormItem',
            'x-component': 'Checkbox',
            'x-content': '允许配置系统，包括界面配置、数据表配置、权限配置、系统配置等全部配置项',
          },
          'strategy.actions': {
            title: t('General action permissions'),
            description: '所有数据表都默认使用通用数据操作权限；同时，可以针对每个数据表单独配置权限。',
            'x-component': 'StrategyActions',
            'x-decorator': 'FormItem',
          },
          allowNewMenu: {
            title: t('Menu permissions'),
            'x-decorator': 'FormItem',
            'x-component': 'Checkbox',
            'x-content': '新增菜单项默认允许访问',
          },
        },
      }}
    />
  );
};
