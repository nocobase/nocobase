import { css } from '@emotion/css';
import { onFieldChange } from '@formily/core';
import React, { useContext } from 'react';

import { useTranslation } from 'react-i18next';
import { useAPIClient, useRequest } from '../../api-client';
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
            const api = useAPIClient();
            return useRequest(
              () =>
                api
                  .resource('roles')
                  .get({
                    filterByTk: currentRecord.name,
                  })
                  .then((res) => {
                    const record = res?.data?.data;
                    record.snippets?.forEach((key) => {
                      record[key] = true;
                    });
                    return { data: record };
                  }),
              options,
            );
          },
          effects() {
            onFieldChange('*', async (field, form) => {
              if (!form.modified) {
                return;
              }
              update(field, form);
            });
          },
        },
        properties: {
          'ui.*': {
            title: t('Configure permissions'),
            type: 'boolean',
            'x-decorator': 'FormItem',
            'x-component': 'Checkbox',
            'x-content': t('Allow to desgin pages'),
            'x-decorator-props': {
              className: css`
                margin-bottom: 5px;
              `,
            },
          },
          pm: {
            type: 'boolean',
            'x-decorator': 'FormItem',
            'x-component': 'Checkbox',
            'x-decorator-props': {
              className: css`
                margin-bottom: 5px;
              `,
            },
            'x-content': t('Allow to manage plugins'),
          },
          'pm.*': {
            type: 'boolean',
            'x-decorator': 'FormItem',
            'x-component': 'Checkbox',
            'x-decorator-props': {
              className: css`
                margin-bottom: 5px;
              `,
            },
            'x-content': t('Allow to configure plugins'),
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
