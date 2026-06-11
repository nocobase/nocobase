/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowEngine } from '@nocobase/flow-engine';
import { useMemoizedFn } from 'ahooks';
import { Form, Select, Space, Tag, type SelectProps } from 'antd';
import React, { useMemo } from 'react';
import { getCollectionFields, type ScheduleCollectionField } from './collectionUtils';

function defaultFilter() {
  return true;
}

function FieldOption({ label, value }: { label?: React.ReactNode; value?: string }) {
  return (
    <Space>
      <span>{label}</span>
      <Tag bordered={false}>{value}</Tag>
    </Space>
  );
}

export function FieldsSelect({
  collection,
  filter = defaultFilter,
  ...others
}: SelectProps & {
  collection?: string;
  filter?: (field: ScheduleCollectionField) => boolean;
}) {
  const flowEngine = useFlowEngine();
  const formCollection = Form.useWatch(['config', 'collection']);
  const fields = getCollectionFields(flowEngine.context.dataSourceManager, collection ?? formCollection);
  const options = useMemo(
    () =>
      fields.filter(filter).map((field) => ({
        label: field.uiSchema?.title ? flowEngine.context.t(field.uiSchema.title) : undefined,
        value: field.name as string,
      })),
    [fields, filter, flowEngine],
  );
  const onSearch = useMemoizedFn((value: string, option?: { label?: string; value?: string }) => {
    if (!value) {
      return true;
    }
    return (
      option?.label?.toLowerCase().includes(value.toLowerCase()) ||
      option?.value?.toLowerCase().includes(value.toLowerCase()) ||
      false
    );
  });

  return (
    <Select
      popupMatchSelectWidth={false}
      {...others}
      options={options}
      filterOption={onSearch}
      optionRender={(option) => <FieldOption label={option.data.label} value={option.data.value as string} />}
    />
  );
}

export default FieldsSelect;
