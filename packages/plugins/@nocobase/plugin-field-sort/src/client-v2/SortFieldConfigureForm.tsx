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
import { useT } from './locale';

const LEGACY_T_TEMPLATE = /^\s*\{\{\s*t\s*\(\s*(['"])(.*?)\1(?:\s*,[\s\S]*?)?\)\s*\}\}\s*$/;

function compileLegacyTemplate(value: React.ReactNode, t: (key: string) => string) {
  if (typeof value !== 'string') {
    return value;
  }
  const match = value.match(LEGACY_T_TEMPLATE);
  return match?.[2] ? t(match[2]) : value;
}

export function SortFieldConfigureForm(props: FieldConfigurePropertyComponentProps) {
  const t = useT();
  const scopeKeyOptions = useMemo(() => {
    const fields = props.field?.fields || props.collection?.fields || [];
    return fields
      .filter((field) => ['string', 'bigInt', 'integer'].includes(field.type))
      .map((field) => ({
        value: field.name,
        label: compileLegacyTemplate(field.uiSchema?.title || field.name, t),
      }));
  }, [props.collection?.fields, props.field?.fields, t]);

  return (
    <Form.Item
      name="scopeKey"
      label={t('Grouped sorting')}
      tooltip={t('When a field is selected for grouping, it will be grouped first before sorting.')}
    >
      <Select allowClear disabled={props.disabled} options={scopeKeyOptions} />
    </Form.Item>
  );
}
