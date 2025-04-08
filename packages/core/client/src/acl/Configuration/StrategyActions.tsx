/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ArrayField } from '@formily/core';
import { connect, useField } from '@formily/react';
import { Checkbox, Select, Table, Tag, TableProps } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCompile } from '../..';
import { useAvailableActions } from './RoleTable';

const toScopes = (value) => {
  if (!value) {
    return {};
  }
  const scopes = {};
  value?.forEach?.((item) => {
    const [name, scope] = item.split(':');
    scopes[name] = scope || 'all';
  });
  return scopes;
};

const toFieldValue = (scopes) => {
  const values = [];
  for (const name in scopes) {
    if (Object.prototype.hasOwnProperty.call(scopes, name)) {
      const scope = scopes[name];
      if (scope === 'all') {
        values.push(name);
      } else {
        values.push(`${name}:${scope}`);
      }
    }
  }
  return values;
};

export const StrategyActions = connect((props) => {
  const { onChange } = props;
  const availableActions = useAvailableActions();
  const compile = useCompile();
  const { t } = useTranslation();
  const field = useField<ArrayField>();
  const scopes = toScopes(field.value);
  return (
    <div>
      <Table
        size={'small'}
        pagination={false}
        rowKey={'name'}
        columns={
          [
            {
              dataIndex: 'displayName',
              title: t('Action display name'),
              render: (value) => compile(value),
            },
            {
              dataIndex: 'onNewRecord',
              title: t('Action type'),
              render: (onNewRecord) =>
                onNewRecord ? (
                  <Tag color={'green'}>{t('Action on new records')}</Tag>
                ) : (
                  <Tag color={'geekblue'}>{t('Action on existing records')}</Tag>
                ),
            },
            {
              dataIndex: 'enabled',
              title: t('Allow'),
              render: (enabled, action) => (
                <Checkbox
                  checked={enabled}
                  aria-label={`${action.name}_checkbox`}
                  onChange={(e) => {
                    if (enabled) {
                      delete scopes[action.name];
                    } else {
                      scopes[action.name] = 'all';
                    }
                    onChange(toFieldValue(scopes));
                  }}
                />
              ),
            },
            {
              dataIndex: 'scope',
              title: t('Data scope'),
              render: (scope, action) =>
                !action.onNewRecord && (
                  <Select
                    data-testid="select-data-scope"
                    popupMatchSelectWidth={false}
                    size={'small'}
                    value={scope}
                    options={[
                      { label: t('All records'), value: 'all' },
                      { label: t('Own records'), value: 'own' },
                    ]}
                    onChange={(value) => {
                      scopes[action.name] = value;
                      onChange(toFieldValue(scopes));
                    }}
                  />
                ),
            },
          ] as TableProps['columns']
        }
        dataSource={availableActions?.map((item) => {
          let scope = 'all';
          let enabled = false;
          if (scopes[item.name]) {
            enabled = true;
            scope = scopes[item.name];
          }
          return {
            ...item,
            enabled,
            scope,
          };
        })}
      />
    </div>
  );
});
