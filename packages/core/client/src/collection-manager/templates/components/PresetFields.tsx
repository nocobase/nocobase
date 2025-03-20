/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer, useForm } from '@formily/react';
import { Table, Tag } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCollectionManager_deprecated } from '../../';
import { useCompile, useApp } from '../../../';

const getDefaultCollectionFields = (presetFields, values, collectionPresetFields) => {
  if (values?.template === 'view' || values?.template === 'sql') {
    return values.fields;
  }
  const fields =
    values.fields?.filter((v) => {
      const item = collectionPresetFields.find((i) => i.value.name === v.name);
      return !item;
    }) || [];
  presetFields.map((v) => {
    const item = collectionPresetFields.find((i) => i.value.name === v);
    item && fields.push(item.value);
  });
  return fields;
};

export const PresetFields = observer(
  (props: any) => {
    const { getInterface } = useCollectionManager_deprecated();
    const form = useForm();
    const compile = useCompile();
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const { t } = useTranslation();
    const app = useApp();
    const mainDataSourcePlugin: any = app.pm.get('data-source-main');
    const collectionPresetFields = mainDataSourcePlugin.getCollectionPresetFields();

    const presetFieldsDataSource = useMemo(() => {
      return collectionPresetFields.map((v) => {
        return {
          field: v.value.uiSchema.title,
          interface: v.value.interface,
          description: v.description,
          name: v.value.name,
        };
      });
    }, []);
    const column = [
      {
        title: t('Field'),
        dataIndex: 'field',
        key: 'field',
        render: (value) => compile(value),
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
        render: (value) => compile(value),
      },
    ];
    useEffect(() => {
      const initialValue = presetFieldsDataSource.map((v) => v.name);
      setSelectedRowKeys(initialValue);
      form.setValues({ ...form.values, autoGenId: false });
    }, [presetFieldsDataSource]);
    useEffect(() => {
      const fields = getDefaultCollectionFields(
        selectedRowKeys.map((v) => v),
        form.values,
        collectionPresetFields,
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
        dataSource={presetFieldsDataSource}
        columns={column}
        rowSelection={{
          type: 'checkbox',
          selectedRowKeys,
          getCheckboxProps: (record: { name: string }) => ({
            name: record.name,
            disabled: props?.disabled || props?.presetFieldsDisabledIncludes?.includes?.(record.name),
          }),
          onChange: (selectedKeys, selectedRows) => {
            const fields = getDefaultCollectionFields(selectedKeys, form.values, collectionPresetFields);
            setSelectedRowKeys(selectedKeys);
            form.setValues({ ...form.values, fields, autoGenId: false });
          },
        }}
      />
    );
  },
  { displayName: 'PresetFields' },
);
