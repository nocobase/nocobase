/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer, useForm } from '@formily/react';
import { Space, Table, Tag } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCollectionManager_deprecated } from '../../';
import { useCompile, useApp } from '../../../';
import { SetPrimaryKeyAction } from '../../Configuration/SetPrimaryKeyAction';
import { DownOutlined, SettingOutlined } from '@ant-design/icons';

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

    const [presetFieldsDataSource, setPresetFieldsDataSource] = useState(
      collectionPresetFields.map(({ value, description }) => ({
        field: value.uiSchema.title,
        interface: value.interface,
        description,
        name: value.name,
        primaryKey: value.primaryKey,
      })),
    );

    const primaryKeyCandidateRef = useRef(null);
    useEffect(() => {
      primaryKeyCandidateRef.current = null;
    }, []);

    const applyPrimaryKeyCandidate = () => {
      const primaryKeyCandidate = primaryKeyCandidateRef.current;
      const [pk] = presetFieldsDataSource.filter((v) => v.primaryKey === true);
      if (!pk || !selectedRowKeys.includes(pk.name) || !primaryKeyCandidate) {
        return;
      }

      const fields = getDefaultCollectionFields(selectedRowKeys, form.values, collectionPresetFields);
      if (!fields?.length) {
        return;
      }
      const idField = fields.find((x) => x.primaryKey === true);
      const restFields = fields.filter((x) => !x.primaryKey);
      if (!idField) {
        return;
      }

      form.setValues({
        ...form.values,
        fields: [
          {
            ...primaryKeyCandidate,
          },
          ...restFields,
        ],
        autoGenId: false,
      });
    };

    const onSetPrimaryKey = (fieldInterface, values) => {
      primaryKeyCandidateRef.current = values;
      applyPrimaryKeyCandidate();
      setPresetFieldsDataSource((prev) => {
        const idFieldIndex = prev.findIndex((x) => x.primaryKey === true);
        if (idFieldIndex === -1) {
          return prev;
        }
        prev[idFieldIndex] = {
          field: values.uiSchema.title,
          interface: values.interface,
          description: fieldInterface.primaryKeyDescription,
          name: values.name,
          primaryKey: values.primaryKey,
        };
        return [...prev];
      });
    };

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
        render: (value, record) =>
          record['primaryKey'] === true ? (
            <SetPrimaryKeyAction
              template={props.template}
              onSetPrimaryKey={onSetPrimaryKey}
              values={primaryKeyCandidateRef.current}
            >
              <Tag>
                <Space>
                  <SettingOutlined />
                  <span>{compile(getInterface(value)?.title)}</span>
                  <DownOutlined />
                </Space>
              </Tag>
            </SetPrimaryKeyAction>
          ) : (
            <Tag>{compile(getInterface(value)?.title)}</Tag>
          ),
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
      applyPrimaryKeyCandidate();
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
