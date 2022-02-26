import { FormItem, FormLayout } from '@formily/antd';
import { ArrayField } from '@formily/core';
import { connect, useField, useForm } from '@formily/react';
import { Checkbox, Select, Table, Tag } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAvailableActions } from '.';
import { useCollectionManager, useCompile, useRecord } from '../..';

const toActionMap = (arr: any[]) => {
  const obj = {};
  arr?.forEach((action) => {
    obj[action.name] = action;
  });
  return obj;
};

export const RolesResourcesActions = connect((props) => {
  const { onChange } = props;
  const form = useForm();
  const roleCollection = useRecord();
  const availableActions = useAvailableActions();
  const { getCollection } = useCollectionManager();
  const collection = getCollection(roleCollection.name);
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
  const fieldPermissions = collection?.fields?.map((field) => {
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
        fields: collection?.fields?.map?.((item) => item.name),
      };
    }
    onChange(Object.values(actionMap));
  };
  const allChecked = {};
  for (const action of availableActionsWithFields) {
    allChecked[action.name] = collection?.fields?.length === actionMap?.[action.name]?.fields?.length;
  }

  return (
    <div>
      <FormLayout layout={'vertical'}>
        <FormItem label={'操作权限'}>
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
                    onChange={() => {
                      toggleAction(action.name);
                    }}
                  />
                ),
              },
              {
                dataIndex: 'scope',
                title: '可操作的数据范围',
                render: () => <Select size={'small'} />,
              },
            ]}
            dataSource={availableActions?.map((item) => {
              let enabled = false;
              let scope = null;
              if (actionMap[item.name]) {
                enabled = true;
                scope = actionMap[item.name]['scope'];
              }
              return {
                ...item,
                enabled,
                scope,
              };
            })}
          />
        </FormItem>
        <FormItem label={'字段权限'}>
          <Table
            pagination={false}
            dataSource={fieldPermissions}
            columns={[
              {
                dataIndex: ['uiSchema', 'title'],
                title: '字段名称',
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
                            item.fields = collection?.fields?.map?.((item) => item.name);
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
            ]}
          />
        </FormItem>
      </FormLayout>
    </div>
  );
});
