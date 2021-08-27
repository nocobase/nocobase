import { SchemaRenderer } from '../../../';
import React, { useContext, useEffect } from 'react';
import { FormItem } from '@formily/antd';
import { action } from '@formily/reactive';
import { useCollectionsContext } from '../../../constate/Collections';
import { Button, Select, Table, Tag } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import cls from 'classnames';
import { uid } from '@formily/shared';
import { Resource } from '../../../resource';
import { TableRowContext, useTable } from '../../../schemas/table';
import { useRequest } from 'ahooks';
import { VisibleContext } from '../../../context';
import { connect, ISchema, observer, useField } from '@formily/react';
import { DescriptionsContext } from '../../../schemas/form';
import { createContext } from 'react';
import { RoleContext } from '.';
import Checkbox from 'antd/lib/checkbox/Checkbox';
import { useState } from 'react';

const actionTypeMap = new Map(
  Object.entries({
    create: '添加',
    get: '查看',
    update: '编辑',
    destroy: '删除',
  }),
);

const useActionDataSource = () => {
  const field = useField<Formily.Core.Models.ArrayField>();
  const dataSource = [];
  for (const [actionName, value] of actionTypeMap) {
    const item = field?.value?.find((item) => {
      return item.actionName === actionName;
    });
    dataSource.push({
      actionName,
      ...item,
      enable: !!item,
    });
  }
  return dataSource;
};

const useFieldPermissions = () => {
  const role = useContext(RoleContext);
  const ctx = useContext(TableRowContext);
  const field = useField<Formily.Core.Models.ArrayField>();
  const [dataSource, setDataSource] = useState([]);
  const findFieldKeys = (actionName): any[] => {
    const item = field?.value?.find((item) => {
      return item.actionName === actionName;
    });
    return (
      item?.fields?.map((field) => {
        return typeof field === 'string' ? field : field.key;
      }) || []
    );
  };
  const service = useRequest(
    () =>
      Resource.make({
        associatedName: 'collections',
        associatedKey: ctx.record.name,
        resourceName: 'fields',
      }).list({
        filter: {
          state: 1,
        },
        appends: ['uiSchema'],
      }),
    {
      formatResult: (data) => data?.data,
      onSuccess(data) {
        setDataSource(
          data.map((field) => {
            return {
              field,
            };
          }),
        );
      },
      // refreshDeps: [ctx.record.name],
    },
  );
  const keys = {
    get: findFieldKeys('get'),
    update: findFieldKeys('update'),
    destroy: findFieldKeys('destroy'),
    create: findFieldKeys('create'),
  };
  const renderCell = (actionName, value, record) => {
    return (
      <Checkbox
        checked={keys[actionName].includes(record.field.key)}
        onChange={(e) => {
          let fieldIndex = field?.value?.findIndex((item) => {
            return item.actionName === actionName;
          });
          if (e.target.checked) {
            if (fieldIndex === -1) {
              field.push({
                actionName,
                collection_name: ctx.record.name,
                role_name: role.name,
                fields: [record.field.key],
              });
            } else {
              const fields = field.value[fieldIndex].fields || [];
              fields.push(record.field.key);
              field.value[fieldIndex].fields = fields;
            }
          } else if (fieldIndex > -1) {
            const fields: any[] = field.value[fieldIndex].fields || [];
            const index = fields?.findIndex((field) => {
              let fieldKey = field;
              if (typeof fieldKey === 'object') {
                fieldKey = fieldKey.key;
              }
              return fieldKey === record?.field?.key;
            });
            if (index > -1) {
              fields.splice(index, 1);
              field.value[fieldIndex].fields = [...fields];
            }
          }
        }}
      />
    );
  };
  const ColumnTitle = ({ actionName }) => {
    const checked =
      dataSource?.length > 0 && keys[actionName]?.length === dataSource?.length;
    return (
      <div>
        <Checkbox
          checked={checked}
          onChange={(e) => {
            let fieldIndex = field?.value?.findIndex((item) => {
              return item.actionName === actionName;
            });
            if (e.target.checked) {
              if (fieldIndex === -1) {
                field.push({
                  actionName,
                  collection_name: ctx.record.name,
                  role_name: role.name,
                  fields: dataSource?.map((item) => {
                    return item?.field?.key;
                  }),
                });
              } else {
                field.value[fieldIndex].fields = dataSource?.map((item) => {
                  return item?.field?.key;
                });
              }
            } else {
              if (fieldIndex > -1) {
                field.value[fieldIndex].fields = [];
              }
            }
          }}
        />{' '}
        {actionTypeMap.get(actionName)}
      </div>
    );
  };
  const columns: any[] = ['create', 'get', 'update'].map((actionName) => ({
    title: <ColumnTitle actionName={actionName} />,
    dataIndex: actionName,
    render: (value, record) => renderCell(actionName, value, record),
  }));
  columns.unshift({
    title: '字段名称',
    dataIndex: ['field', 'uiSchema', 'title'],
  });
  return { columns, dataSource, service };
};

export const ActionPermissionField = observer((props) => {
  const role = useContext(RoleContext);
  const ctx = useContext(TableRowContext);
  const field = useField<Formily.Core.Models.ArrayField>();
  const actionDataSource = useActionDataSource();
  const { columns, dataSource, service } = useFieldPermissions();
  console.log('actionPermissions', field?.value);
  return (
    <div>
      <Table
        dataSource={actionDataSource}
        pagination={false}
        columns={[
          {
            title: '操作',
            dataIndex: 'actionName',
            render: (value) => <span>{actionTypeMap.get(value)}</span>,
          },
          {
            title: '类型',
            dataIndex: 'actionName',
            render: (value) =>
              value === 'create' ? (
                <Tag>对新数据操作</Tag>
              ) : (
                <Tag>对已有数据操作</Tag>
              ),
          },
          {
            title: '允许操作',
            dataIndex: 'enable',
            render: (value, record) => (
              <Checkbox
                checked={!!value}
                onChange={(e) => {
                  const index = field?.value?.findIndex((item) => {
                    return item.actionName === record.actionName;
                  });
                  console.log(
                    'e.target.checked',
                    e.target.checked,
                    index,
                    field?.value,
                  );
                  if (e.target.checked) {
                    if (index === -1) {
                      field.push({
                        collection_name: ctx.record.name,
                        role_name: role.name,
                        actionName: record.actionName,
                        fields: [],
                      });
                    }
                  } else {
                    if (index > -1) {
                      field.remove(index);
                    }
                  }
                }}
              />
            ),
          },
          {
            title: '可操作的数据范围',
            dataIndex: ['scope', 'title'],
            render: (value) => (
              <Select style={{ minWidth: 150 }} size={'small'}></Select>
            ),
          },
        ]}
      />
      <br />
      <br />
      {/* ActionPermissionField <br />
      {role.name} <br />
      {ctx.record.name} */}
      <Table
        loading={service.loading}
        columns={columns}
        dataSource={dataSource}
        pagination={false}
      />
    </div>
  );
});
