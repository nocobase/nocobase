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
import { SetPrimaryKeyAction, ID_FIELD } from '../../Configuration/SetPrimaryKeyAction';
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
      collectionPresetFields.map((v) => {
        return {
          field: v.value.uiSchema.title,
          interface: v.value.interface,
          description: v.description,
          name: v.value.name,
        };
      }),
    );

    const primaryKeyCandidateRef = useRef(null);
    useEffect(() => {
      primaryKeyCandidateRef.current = null;
    }, []);

    const applyPrimaryKeyCandidate = () => {
      const primaryKeyCandidate = primaryKeyCandidateRef.current;
      if (!selectedRowKeys.includes(ID_FIELD) || !primaryKeyCandidate) {
        return;
      }

      const fields = getDefaultCollectionFields(selectedRowKeys, form.values, collectionPresetFields);
      if (!fields?.length) {
        return;
      }
      const [idField] = fields.filter((x) => x.name === ID_FIELD);
      const restFields = fields.filter((x) => x.name !== ID_FIELD);
      if (!idField) {
        return;
      }

      form.setValues({
        ...form.values,
        fields: [
          {
            ...primaryKeyCandidate,
            name: ID_FIELD,
          },
          ...restFields,
        ],
        autoGenId: false,
      });
    };

    const onSetPrimaryKey = (values) => {
      primaryKeyCandidateRef.current = values;
      applyPrimaryKeyCandidate();
      setPresetFieldsDataSource((prev) => {
        const idFieldIndex = prev.findIndex((x) => x.name === ID_FIELD);
        if (idFieldIndex === -1) {
          return prev;
        }
        prev[idFieldIndex] = {
          field: values.uiSchema.title,
          interface: values.interface,
          description: values.description,
          name: ID_FIELD,
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
          record.name === ID_FIELD ? (
            <SetPrimaryKeyAction
              template={props.template}
              onSetPrimaryKey={onSetPrimaryKey}
              values={
                primaryKeyCandidateRef.current ?? {
                  uiSchema: { title: record['field'] },
                  description: record['description'],
                }
              }
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
