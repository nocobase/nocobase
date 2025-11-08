/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer, useForm } from '@formily/react';
import { Select, Space, Tag } from 'antd';
import React, { useCallback, useMemo } from 'react';

import { parseCollectionName, useCollectionManager_deprecated, useCompile } from '@nocobase/client';

function defaultFilter() {
  return true;
}

function FieldOption({ label, value }) {
  return (
    <Space>
      <span>{label}</span>
      <Tag bordered={false}>{value}</Tag>
    </Space>
  );
}

export const FieldsSelect = observer(
  (props: any) => {
    const { filter = defaultFilter, ...others } = props;
    const compile = useCompile();
    const { getCollectionFields } = useCollectionManager_deprecated();
    const { values } = useForm();
    const [dataSourceName, collectionName] = parseCollectionName(values?.collection);
    const fields = getCollectionFields(collectionName, dataSourceName);
    const options = useMemo(
      () =>
        fields.filter(filter).map((field) => ({
          label: compile(field.uiSchema?.title),
          value: field.name,
        })),
      [fields, filter],
    );
    const onSearch = useCallback((value: string, option) => {
      if (!value) {
        return true;
      }
      return (
        option.label?.toLowerCase().includes(value.toLowerCase()) ||
        option.value?.toLowerCase().includes(value.toLowerCase())
      );
    }, []);

    return (
      <Select
        popupMatchSelectWidth={false}
        {...others}
        options={options}
        filterOption={onSearch}
        optionRender={FieldOption}
      />
    );
  },
  { displayName: 'FieldsSelect' },
);
