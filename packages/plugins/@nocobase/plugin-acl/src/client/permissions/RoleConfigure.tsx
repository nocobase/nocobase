import { onFieldChange } from '@formily/core';
import { connect } from '@formily/react';
import { SchemaComponent, useAPIClient, useRequest } from '@nocobase/client';
import { Checkbox } from 'antd';
import uniq from 'lodash/uniq';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { RolesManagerContext } from '../RolesManagerProvider';
import { StrategyActions } from './StrategyActions';

const SnippetCheckboxGroup = connect((props) => {
  const { t } = useTranslation();
  return (
    <Checkbox.Group
      style={{
        width: '100%',
        display: 'block',
      }}
      value={props.value}
      onChange={(values) => {
        const snippets = ['ui.*', 'pm', 'pm.*', 'app'];
        const disallowSnippets = snippets.map((key) => `!${key}`);
        const value = uniq([...(props.value || []), ...values])
          .filter((key) => key && !disallowSnippets.includes(key))
          .map((key) => {
            if (!snippets.includes(key) || values?.includes(key)) {
              return key;
            }
            return `!${key}`;
          });
        for (const key of snippets) {
          if (!value.includes(key) && !value.includes(`!${key}`)) {
            value.push(`!${key}`);
          }
        }
        props.onChange(value);
      }}
    >
      <div style={{ marginTop: 16 }}>
        <Checkbox value="ui.*">{t('Allows to configure interface')}</Checkbox>
      </div>
      <div style={{ marginTop: 8 }}>
        <Checkbox value="pm">{t('Allows to install, activate, disable plugins')}</Checkbox>
      </div>
      <div style={{ marginTop: 8 }}>
        <Checkbox value="pm.*">{t('Allows to configure plugins')}</Checkbox>
      </div>
      <div style={{ marginTop: 8 }}>
        <Checkbox value="app">{t('Allows to clear cache, reboot application')}</Checkbox>
      </div>
    </Checkbox.Group>
  );
});

export const RoleConfigure = () => {
  const { role } = useContext(RolesManagerContext);
  const { t } = useTranslation();
  return (
    <SchemaComponent
      components={{ SnippetCheckboxGroup, StrategyActions }}
      schema={{
        type: 'void',
        name: 'form',
        'x-component': 'Form',
        'x-component-props': {
          useValues: (options: any) => {
            const api = useAPIClient();
            return useRequest(
              () =>
                api
                  .resource('roles')
                  .get({
                    filterByTk: role?.name,
                  })
                  .then((res) => {
                    const record = res?.data?.data;
                    record.snippets?.forEach((key: string) => {
                      record[key] = true;
                    });
                    return { data: record };
                  }),
              {
                ...options,
                refreshDeps: [role?.name],
              },
            );
          },
          effects() {
            onFieldChange('*', async (field, form) => {
              if (!form.modified) {
                return;
              }
              // await update(field, form);
            });
          },
        },
        properties: {
          snippets: {
            title: t('Configure permissions'),
            type: 'boolean',
            'x-decorator': 'FormItem',
            'x-component': 'SnippetCheckboxGroup',
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
