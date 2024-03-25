import { observer, useForm } from '@formily/react';
import { Table, Tag } from 'antd';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCollectionManager_deprecated } from '../../';
import { useCompile } from '../../../';

const getDefaultCollectionFields = (presetFields, values) => {
  if (values?.template === 'view' || values?.template === 'sql') {
    return values.fields;
  }
  const defaults = values.fields
    ? [...values.fields].filter((v) => {
        return !['id', 'createdBy', 'updatedAt', 'createdAt', 'updatedBy'].includes(v.name);
      })
    : [];
  if (presetFields.find((v) => v.name === 'id')) {
    defaults.push({
      name: 'id',
      type: 'bigInt',
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
      uiSchema: { type: 'number', title: '{{t("ID")}}', 'x-component': 'InputNumber', 'x-read-pretty': true },
      interface: 'integer',
    });
  }
  if (presetFields.find((v) => v.name === 'createdAt')) {
    defaults.push({
      name: 'createdAt',
      interface: 'createdAt',
      type: 'date',
      field: 'createdAt',
      uiSchema: {
        type: 'datetime',
        title: '{{t("Created at")}}',
        'x-component': 'DatePicker',
        'x-component-props': {},
        'x-read-pretty': true,
      },
    });
  }
  if (presetFields.find((v) => v.name === 'createdBy')) {
    defaults.push({
      name: 'createdBy',
      interface: 'createdBy',
      type: 'belongsTo',
      target: 'users',
      foreignKey: 'createdById',
      uiSchema: {
        type: 'object',
        title: '{{t("Created by")}}',
        'x-component': 'AssociationField',
        'x-component-props': {
          fieldNames: {
            value: 'id',
            label: 'nickname',
          },
        },
        'x-read-pretty': true,
      },
    });
  }
  if (presetFields.find((v) => v.name === 'updatedAt')) {
    defaults.push({
      type: 'date',
      field: 'updatedAt',
      name: 'updatedAt',
      interface: 'updatedAt',
      uiSchema: {
        type: 'string',
        title: '{{t("Last updated at")}}',
        'x-component': 'DatePicker',
        'x-component-props': {},
        'x-read-pretty': true,
      },
    });
  }
  if (presetFields.find((v) => v.name === 'updatedBy')) {
    defaults.push({
      type: 'belongsTo',
      target: 'users',
      foreignKey: 'updatedById',
      name: 'updatedBy',
      interface: 'updatedBy',
      uiSchema: {
        type: 'object',
        title: '{{t("Last updated by")}}',
        'x-component': 'AssociationField',
        'x-component-props': {
          fieldNames: {
            value: 'id',
            label: 'nickname',
          },
        },
        'x-read-pretty': true,
      },
    });
  }
  // 其他
  return defaults;
};
export const PresetFields = observer(
  (props: any) => {
    const { getInterface } = useCollectionManager_deprecated();
    const form = useForm();
    const compile = useCompile();
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const { t } = useTranslation();
    const column = [
      {
        title: t('Field'),
        dataIndex: 'field',
        key: 'field',
      },
      {
        title: t('Interface'),
        dataIndex: 'interface',
        key: 'interface',
        render: (value) => <Tag>{compile(getInterface(value)?.title)}</Tag>,
      },
      {
        title: t('Description'),
        dataIndex: 'description',
        key: 'description',
      },
    ];
    const dataSource = [
      {
        field: t('ID'),
        interface: 'integer',
        description: t('Primary key, unique identifier, self growth'),
        name: 'id',
      },
      {
        field: t('Created at'),
        interface: 'createdAt',
        description: t('Store the creation time of each record'),
        name: 'createdAt',
      },
      {
        field: t('Last updated at'),
        interface: 'updatedAt',
        description: t('Store the last update time of each record'),
        name: 'updatedAt',
      },
      {
        field: t('Created by'),
        interface: 'createdBy',
        description: t('Store the creation user of each record'),
        name: 'createdBy',
      },

      {
        field: t('Last updated by'),
        interface: 'updatedBy',
        description: t('Store the last update user of each record'),
        name: 'updatedBy',
      },
    ];
    useEffect(() => {
      const config = {
        autoGenId: true,
        createdAt: true,
        createdBy: true,
        updatedAt: true,
        updatedBy: true,
      };
      const initialValue = ['id', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy'];
      setSelectedRowKeys(initialValue);
      form.setValues({ ...form.values, ...config });
    }, []);
    useEffect(() => {
      const fields = getDefaultCollectionFields(
        selectedRowKeys.map((v) => {
          return {
            name: v,
          };
        }),
        form.values,
      );
      form.setValuesIn('fields', fields);
    }, [selectedRowKeys]);
    return (
      <Table
        size="small"
        pagination={false}
        rowKey="name"
        bordered
        scroll={{ x: 600 }}
        dataSource={dataSource}
        columns={column}
        rowSelection={{
          type: 'checkbox',
          selectedRowKeys,
          getCheckboxProps: (record) => ({
            disabled: form.values.template === 'file', // Column configuration not to be checked
            name: record.name,
          }),
          onChange: (_, selectedRows) => {
            const fields = getDefaultCollectionFields(selectedRows, form.values);
            const config = {
              autoGenId: !!fields.find((v) => v.name === 'id'),
              createdAt: !!fields.find((v) => v.name === 'createdAt'),
              createdBy: !!fields.find((v) => v.name === 'createdBy'),
              updatedAt: !!fields.find((v) => v.name === 'updatedAt'),
              updatedBy: !!fields.find((v) => v.name === 'updatedBy'),
            };
            setSelectedRowKeys(
              fields?.map?.((v) => {
                return v.name;
              }),
            );
            form.setValues({ ...form.values, fields, ...config });
          },
        }}
      />
    );
  },
  { displayName: 'PresetFields' },
);
