import { onFieldChange } from '@formily/core';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useAPIClient, useRequest, SchemaComponent } from '@nocobase/client';
import { PermissionContext } from './PermisionProvider';

export const RoleConfigure = () => {
  const { update, currentRecord } = useContext(PermissionContext);
  const { t } = useTranslation();
  const { name: dataSourceKey } = useParams();

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
                  .resource(`dataSources/${dataSourceKey || 'main'}/roles`)
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
              await update(field, form);
            });
          },
        },
        properties: {
          'strategy.actions': {
            // title: t('Global action permissions'),
            description: t(
              'All collections use general action permissions by default; permission configured individually will override the default one.',
            ),
            'x-component': 'StrategyActions',
            // 'x-decorator': 'FormItem',
          },
        },
      }}
    />
  );
};
