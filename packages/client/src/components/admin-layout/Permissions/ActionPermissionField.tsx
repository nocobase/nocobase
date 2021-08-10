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
    create: '新增',
    get: '查看',
    update: '编辑',
    destroy: '删除',
  }),
);

const useActionDataSource = () => {
  const field = useField<Formily.Core.Models.ArrayField>();
  const dataSource = [];
  for (const [actionName, value] of actionTypeMap) {
    const index = field?.value?.findIndex((item) => {
      return item.actionName === actionName;
    });
    dataSource.push({
      actionName,
      enable: index > -1,
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
      item?.fieldPermissions?.map((permission) => permission.field_key) || []
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
  }
  const renderCell = (actionName, value, record) => {
    return (
      <Checkbox
        checked={keys[actionName].includes(record.field.key)}
        onChange={(e) => {
          let fieldIndex = field?.value?.findIndex((item) => {
            return item.actionName === actionName;
          });
          console.log('fieldIndex', fieldIndex)
          if (e.target.checked) {
            if (fieldIndex === -1) {
              field.push({
                actionName,
                collection_name: ctx.record.name,
                role_name: role.name,
                fieldPermissions: [{
                  field_key: record.field.key,
                }],
              });
            } else {
              const permissions = field.value[fieldIndex].fieldPermissions || [];
              permissions.push({
                field_key: record.field.key,
              });
              field.value[fieldIndex].fieldPermissions = permissions;
              console.log('fieldIndex', permissions);
            }
          }
          
          // fieldIndex = field.value.length - 1;
          // const permissions: any[] =
          //   field.value[fieldIndex].fieldPermissions || [];
          // const index = permissions?.findIndex(
          //   (permission) => permission.field_key === record?.field?.key,
          // );
          // if (e.target.checked) {
          //   permissions.push({
          //     field_key: record.field.key,
          //   });
          // } else {
          //   permissions.splice(index, 1);
          // }
          // console.log({ permissions });
          // field.value[fieldIndex].fieldPermissions = permissions;
        }}
      />
    );
  };
  const columns = [
    {
      title: '字段名称',
      dataIndex: ['field', 'uiSchema', 'title'],
    },
    {
      title: <div>新增 <Checkbox /></div>,
      dataIndex: 'create',
      render: (value, record) => renderCell('create', value, record),
    },
    {
      title: '查看',
      dataIndex: 'get',
      render: (value, record) => renderCell('get', value, record),
    },
    {
      title: '编辑',
      dataIndex: 'update',
      render: (value, record) => renderCell('update', value, record),
    },
  ];
  return { columns, dataSource, service };
};

export const ActionPermissionField = observer((props) => {
  const role = useContext(RoleContext);
  const ctx = useContext(TableRowContext);
  const field = useField<Formily.Core.Models.ArrayField>();
  const actionDataSource = useActionDataSource();
  const { columns, dataSource, service } = useFieldPermissions();
  console.log('field?.value', field?.value);
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
                        fieldPermissions: [],
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
