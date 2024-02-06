import React, { useState, useEffect } from 'react';
import { Table, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { observer, useField, useForm } from '@formily/react';
import { useCompile } from '../../../';
import { useCollectionManager } from '../../';

const getDefaultCollectionFields = (presetFields, values) => {
  if (values?.template === 'view' || values?.template === 'sql') {
    return values.fields;
  }
  const defaults = values.fields ? [...values.fields] : [];
  if (presetFields.find((v) => v.name === 'id')) {
    const pk = values.fields.find((f) => f.primaryKey);
    if (!pk) {
      defaults.push({
        name: 'id',
        type: 'bigInt',
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        uiSchema: { type: 'number', title: '{{t("ID")}}', 'x-component': 'InputNumber', 'x-read-pretty': true },
        interface: 'id',
      });
    }
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
export const PresetFields = observer((props: any) => {
  const { getInterface } = useCollectionManager();
  const form = useForm();
  const compile = useCompile();
  const [selectedRowKeys, setSelectedRowKeys] = useState(
    form.values?.fields?.map?.((v) => {
      return v.name;
    }),
  );
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
      field: t('CreatedBy'),
      interface: 'm2o',
      description: t('Store the creation user of each record'),
      name: 'createdBy',
    },
    {
      field: t('CreatedAt'),
      interface: 'datetime',
      description: t('Store the creation time of each record'),
      name: 'createdAt',
    },
    {
      field: t('UpdatedAt'),
      interface: 'datetime',
      description: t('Store the last update time of each recordd'),
      name: 'updatedAt',
    },
    {
      field: t('UpdatedBy'),
      interface: 'm2o',
      description: t('Store the last update user of each record'),
      name: 'updatedBy',
    },
  ];
  useEffect(() => {
    setSelectedRowKeys(
      form.values?.fields?.map?.((v) => {
        return v.name;
      }),
    );
  }, [form.values?.fields]);
  return (
    <Table
      rowKey="name"
      dataSource={dataSource}
      columns={column}
      rowSelection={{
        type: 'checkbox',
        selectedRowKeys,
        onChange: (_, selectedRows) => {
          const fields = getDefaultCollectionFields(selectedRows, form.values);
          setSelectedRowKeys(
            fields?.map?.((v) => {
              return v.name;
            }),
          );
          form.setValuesIn('fields', fields);
        },
      }}
    />
  );
});
