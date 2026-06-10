/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FieldConfigurePropertyComponentProps } from '@nocobase/client-v2';
import { Form, Select } from 'antd';
import React, { useMemo } from 'react';
import { useT } from '../locale';
import { getFieldTitle } from './utils';

function isUsableTargetKey(field: Record<string, unknown>) {
  return !!((field.primaryKey || field.unique) && field.interface);
}

export function TargetKeyConfigureField(props: FieldConfigurePropertyComponentProps) {
  const t = useT();
  const target = Form.useWatch('target', props.form);
  const targetCollection = props.collections?.find((collection) => collection.name === target);
  const options = useMemo(
    () =>
      (targetCollection?.fields || []).filter(isUsableTargetKey).map((field) => ({
        value: String(field.name),
        label: getFieldTitle(field, t),
      })),
    [targetCollection?.fields, t],
  );

  return (
    <Form.Item
      name={props.namePath}
      label={props.title}
      tooltip={props.tooltip}
      rules={props.schema?.required ? [{ required: true }] : undefined}
    >
      <Select {...(props.componentProps || {})} disabled={props.disabled} options={options} showSearch />
    </Form.Item>
  );
}
