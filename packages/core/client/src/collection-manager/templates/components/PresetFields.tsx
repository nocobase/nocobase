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
import React, { useEffect, useState, useMemo } from 'react';
import { mapValues, uniqBy, orderBy } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useCollectionManager_deprecated } from '../../';
import { useCompile } from '../../../';

export const PresetFields = observer(
  (props: any) => {
    const { getInterface, interfaces } = useCollectionManager_deprecated();
    const form = useForm();
    const compile = useCompile();
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const { t } = useTranslation();

    const presetInterfaceFields = useMemo(() => {
      const result = [];
      mapValues(interfaces, (v: any) => {
        if (v.presetField) {
          result.push(v);
        }
      });
      return orderBy(result, ['presetField.order', 'desc']);
    }, []);

    const column = useMemo(
      () => [
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
      ],
      [],
    );

    const dataSource = useMemo(
      () =>
        presetInterfaceFields.map((v) => {
          return {
            field: compile(v.title),
            interface: v.name,
            description: compile(v.description),
            name: v.name,
          };
        }),
      [presetInterfaceFields],
    );

    useEffect(() => {
      const initialValue = presetInterfaceFields.map((v) => v.name);
      setSelectedRowKeys(initialValue);
    }, []);

    useEffect(() => {
      const result = handleGetPresetFields(selectedRowKeys);
      form.setValues(result);
    }, [selectedRowKeys]);

    const handleGetPresetFields = (interfaceKeys) => {
      const initialFields = form.values?.fields?.filter((v) => presetInterfaceFields.find((l) => l.name === v)) || [];
      const fields = uniqBy(
        initialFields.concat(
          interfaceKeys.map((v) => {
            return presetInterfaceFields.find((k) => k.name === v).default;
          }),
        ),
        'name',
      );
      form.setValuesIn('fields', fields);
      let resultsValues = form.values;
      presetInterfaceFields.map((v) => {
        resultsValues = v.presetField?.beforeSubmit?.(resultsValues);
      });
      return resultsValues;
    };

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
            name: record.name,
            disabled: props?.disabled || props?.presetFieldsDisabledIncludes?.includes?.(record.name),
          }),
          onChange: (selectedRowKeys, selectedRows) => {
            //  const result=handleGetPresetFields(selectedRowKeys)
            //  console.log(result)
            setSelectedRowKeys(selectedRowKeys);
            // form.setValues(result);
          },
        }}
      />
    );
  },
  { displayName: 'PresetFields' },
);
