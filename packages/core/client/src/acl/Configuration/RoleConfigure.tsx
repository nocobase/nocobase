import { onFieldChange } from '@formily/core';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useRequest } from '../../api-client';
import { SchemaComponent } from '../../schema-component';
import { PermissionContext } from './PermisionProvider';

export const RoleConfigure = () => {
  const { update, currentRecord } = useContext(PermissionContext);
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
                  filterByTk: currentRecord.name,
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
              update(form);
            });
          },
        },
        properties: {
          allowConfigure: {
            title: t('Configure permissions'),
            'x-decorator': 'FormItem',
            'x-component': 'Checkbox',
            'x-content': t('Allows configuration of the whole system, including UI, collections, permissions, etc.'),
          },
          'strategy.actions': {
            title: t('Global action permissions'),
            description: t(
              'All collections use general action permissions by default; permission configured individually will override the default one.',
            ),
            'x-component': 'StrategyActions',
            'x-decorator': 'FormItem',
          },
          allowNewMenu: {
            title: t('Menu permissions'),
            'x-decorator': 'FormItem',
            'x-component': 'Checkbox',
            'x-content': t('New menu items are allowed to be accessed by default.'),
          },
        },
      }}
    />
  );
};
