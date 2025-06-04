/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormItem, FormLayout } from '@formily/antd-v5';
import { ArrayField } from '@formily/core';
import { connect, useField, useForm } from '@formily/react';
import { Checkbox, Table, Tag, TableProps } from 'antd';
import { isEmpty } from 'lodash';
import React, { createContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useCollectionManager_deprecated, useCompile, useRecord } from '../..';
import { antTableCell } from '../style';
import { useAvailableActions } from './RoleTable';
import { ScopeSelect } from './ScopeSelect';

const toActionMap = (arr: any[]) => {
  const obj = {};
  arr?.forEach?.((action) => {
    if (action.name) {
      obj[action.name] = action;
      obj[action.name]['scope'] = isEmpty(action.scope) ? null : action.scope;
    }
  });
  return obj;
};

export const RoleResourceCollectionContext = createContext<any>({});
RoleResourceCollectionContext.displayName = 'RoleResourceCollectionContext';

export const RolesResourcesActions = connect((props) => {
  // const { onChange } = props;
  const onChange = (values) => {
    const items = values.map((item) => {
      return {
        ...item,
        scope: isEmpty(item.scope) ? null : item.scope,
      };
    });
    props.onChange(items);
  };
  const form = useForm();
  const roleCollection = useRecord();
  const availableActions = useAvailableActions();
  const { getCollection, getCollectionFields } = useCollectionManager_deprecated();
  const collection = getCollection(roleCollection.collectionName);
  const collectionFields = getCollectionFields(roleCollection.collectionName);
  const compile = useCompile();
  const { t } = useTranslation();
  const field = useField<ArrayField>();
  const actionMap: any = toActionMap(field.value || []);
  const inAction = (actionName, fieldName) => {
    const action = actionMap?.[actionName];
    if (!action) {
      return false;
    }
    return action?.fields?.includes(fieldName);
  };
  const availableActionsWithFields = availableActions.filter((action) => action.allowConfigureFields);
  const fieldPermissions = collectionFields
    ?.filter((field) => field.interface)
    ?.map((field) => {
      const permission = { ...field };
      for (const action of availableActionsWithFields) {
        permission[action.name] = inAction(action.name, field.name);
      }
      return permission;
    });
  const toggleAction = (actionName: string) => {
    if (actionMap[actionName]) {
      delete actionMap[actionName];
    } else {
      actionMap[actionName] = {
        name: actionName,
        fields: collectionFields?.filter((field) => field.interface)?.map?.((item) => item.name),
      };
    }
    onChange(Object.values(actionMap));
  };
  const setScope = (actionName, scope) => {
    if (!actionMap[actionName]) {
      toggleAction(actionName);
      actionMap[actionName]['scope'] = scope;
    } else {
      actionMap[actionName]['scope'] = scope;
      onChange(Object.values(actionMap));
    }
  };
  const allChecked = {};
  for (const action of availableActionsWithFields) {
    allChecked[action.name] =
      collectionFields?.filter((field) => field.interface)?.length === actionMap?.[action.name]?.fields?.length;
  }
  return (
    <div>
      <RoleResourceCollectionContext.Provider value={collection}>
        <FormLayout layout={'vertical'}>
          <FormItem label={t('Action permission')}>
            <Table
              className={antTableCell}
              size={'small'}
              pagination={false}
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
                        onChange={() => {
                          toggleAction(action.name);
                        }}
                      />
                    ),
                  },
                  {
                    dataIndex: 'scope',
                    title: t('Data scope'),
                    render: (value, action) =>
                      !action.onNewRecord && (
                        <ScopeSelect
                          value={value}
                          onChange={(scope) => {
                            setScope(action.name, scope);
                          }}
                        />
                      ),
                  },
                ] as TableProps['columns']
              }
              dataSource={availableActions?.map((item) => {
                let enabled = false;
                let scope = null;
                if (actionMap[item.name]) {
                  enabled = true;
                  if (!item.onNewRecord) {
                    scope = actionMap[item.name]['scope'];
                  }
                }
                return {
                  ...item,
                  enabled,
                  scope,
                };
              })}
            />
          </FormItem>
          <FormItem label={t('Field permission')}>
            <Table
              className={antTableCell}
              pagination={false}
              dataSource={fieldPermissions}
              columns={
                [
                  {
                    dataIndex: ['uiSchema', 'title'],
                    title: t('Field display name'),
                    render: (value) => compile(value),
                  },
                  ...availableActionsWithFields.map((action) => {
                    const checked = allChecked?.[action.name];
                    return {
                      dataIndex: action.name,
                      title: (
                        <>
                          <Checkbox
                            checked={checked}
                            onChange={() => {
                              const item = actionMap[action.name] || {
                                name: action.name,
                              };
                              if (checked) {
                                item.fields = [];
                              } else {
                                item.fields = collectionFields?.map?.((item) => item.name);
                              }
                              actionMap[action.name] = item;
                              onChange(Object.values(actionMap));
                            }}
                          />{' '}
                          {compile(action.displayName)}
                        </>
                      ),
                      render: (checked, field) => (
                        <Checkbox
                          checked={checked}
                          aria-label={`${action.name}_checkbox`}
                          onChange={() => {
                            const item = actionMap[action.name] || {
                              name: action.name,
                            };
                            const fields: string[] = item.fields || [];
                            if (checked) {
                              const index = fields.indexOf(field.name);
                              fields.splice(index, 1);
                            } else {
                              fields.push(field.name);
                            }
                            item.fields = fields;
                            actionMap[action.name] = item;
                            onChange(Object.values(actionMap));
                          }}
                        />
                      ),
                    };
                  }),
                ] as TableProps['columns']
              }
            />
          </FormItem>
        </FormLayout>
      </RoleResourceCollectionContext.Provider>
    </div>
  );
});
