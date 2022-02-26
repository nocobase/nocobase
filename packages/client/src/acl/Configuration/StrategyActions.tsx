import { ArrayField } from '@formily/core';
import { connect, useField } from '@formily/react';
import { Checkbox, Select, Table, Tag } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAvailableActions } from '.';
import { useCompile } from '../..';

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
        columns={[
          {
            dataIndex: 'displayName',
            title: '操作',
            render: (value) => compile(value),
          },
          {
            dataIndex: 'onNewRecord',
            title: '类型',
            render: (onNewRecord) =>
              onNewRecord ? (
                <Tag color={'green'}>{t('Operate on new record')}</Tag>
              ) : (
                <Tag color={'geekblue'}>{t('Operate on existing record')}</Tag>
              ),
          },
          {
            dataIndex: 'enabled',
            title: '允许操作',
            render: (enabled, action) => (
              <Checkbox
                checked={enabled}
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
            title: '可操作的数据范围',
            render: (scope, action) =>
              !action.onNewRecord && (
                <Select
                  size={'small'}
                  value={scope}
                  options={[
                    { label: 'All records', value: 'all' },
                    { label: 'Own records', value: 'own' },
                  ]}
                  onChange={(value) => {
                    scopes[action.name] = value;
                    onChange(toFieldValue(scopes));
                  }}
                />
              ),
          },
        ]}
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
