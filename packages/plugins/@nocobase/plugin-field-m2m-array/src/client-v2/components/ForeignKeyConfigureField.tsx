/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FieldConfigurePropertyComponentProps } from '@nocobase/client-v2';
import { AutoComplete, Form, Select } from 'antd';
import React, { useMemo } from 'react';
import { useT } from '../locale';
import { getFieldTitle } from './utils';

function isJsonArrayField(field: Record<string, unknown>) {
  return ['set', 'array'].includes(String(field.type)) && field.interface === 'json';
}

export function ForeignKeyConfigureField(props: FieldConfigurePropertyComponentProps) {
  const t = useT();
  const template = Form.useWatch('template', props.form);
  const componentProps = props.componentProps || {};
  const options = useMemo(() => {
    const fields = props.collection?.fields || [];
    return fields.filter(isJsonArrayField).map((field) => ({
      value: String(field.name),
      label: getFieldTitle(field, t),
    }));
  }, [props.collection?.fields, t]);
  const Component = template === 'view' ? Select : AutoComplete;

  return (
    <Form.Item
      name={props.namePath}
      label={props.title}
      tooltip={props.tooltip}
      rules={props.schema?.required ? [{ required: true }] : undefined}
    >
      <Component {...componentProps} disabled={props.disabled} options={options} showSearch />
    </Form.Item>
  );
}
