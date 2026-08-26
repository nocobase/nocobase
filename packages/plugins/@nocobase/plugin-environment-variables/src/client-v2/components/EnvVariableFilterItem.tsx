/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer } from '@nocobase/flow-engine';
import { Input, Select, Space } from 'antd';
import React, { type FC, useMemo } from 'react';
import { useT } from '../locale';

interface EnvVariableFilterItemProps {
  value: {
    path: string;
    operator: string;
    value: any;
  };
}

type FieldDef = {
  name: 'name' | 'type' | 'value';
  title: string;
  operators: { value: string; label: string }[];
  /** Renders the right-hand value input. */
  ValueComponent: FC<{ value: any; operator: string; onChange: (v: any) => void }>;
};

const TextValueInput: FieldDef['ValueComponent'] = ({ value, onChange }) => (
  <Input
    style={{ minWidth: 160 }}
    value={value ?? ''}
    onChange={(event) => onChange(event.target.value)}
    placeholder=""
  />
);

const TypeMultiSelect: FieldDef['ValueComponent'] = ({ value, onChange }) => {
  const t = useT();
  const options = useMemo(
    () => [
      { value: 'default', label: t('Plain text') },
      { value: 'secret', label: t('Encrypted') },
    ],
    [t],
  );
  return (
    <Select
      mode="tags"
      style={{ minWidth: 200 }}
      value={Array.isArray(value) ? value : value != null ? [value] : []}
      onChange={(next: string[]) => onChange(next)}
      options={options}
    />
  );
};

const useFieldDefs = (): FieldDef[] => {
  const t = useT();
  return useMemo(
    () => [
      {
        name: 'name',
        title: t('Name'),
        operators: [
          { value: '$includes', label: t('contains') },
          { value: '$notIncludes', label: t('does not contain') },
          { value: '$eq', label: t('is') },
          { value: '$ne', label: t('is not') },
        ],
        ValueComponent: TextValueInput,
      },
      {
        name: 'type',
        title: t('Type'),
        operators: [
          { value: '$match', label: t('is') },
          { value: '$notMatch', label: t('is not') },
        ],
        ValueComponent: TypeMultiSelect,
      },
      {
        name: 'value',
        title: t('Value'),
        operators: [
          { value: '$includes', label: t('contains') },
          { value: '$notIncludes', label: t('does not contain') },
          { value: '$eq', label: t('is') },
          { value: '$ne', label: t('is not') },
        ],
        ValueComponent: TextValueInput,
      },
    ],
    [t],
  );
};

/**
 * Static-fields FilterItem for the environment-variables settings page.
 *
 * Mirrors v1 `Filter.Action`'s 3 columns (field / operator / value) without
 * depending on a CollectionBlockModel — the fields are hardcoded to the
 * environmentVariables collection schema (name / type / value).
 */
export const EnvVariableFilterItem: FC<EnvVariableFilterItemProps> = observer(
  ({ value }) => {
    const fields = useFieldDefs();
    const currentField = fields.find((field) => field.name === value.path);
    const operatorOptions = currentField?.operators ?? [];
    const ValueComponent = currentField?.ValueComponent ?? TextValueInput;
    const t = useT();

    const fieldOptions = useMemo(() => fields.map((field) => ({ value: field.name, label: field.title })), [fields]);

    return (
      <Space style={{ flex: 1 }} wrap>
        <Select
          style={{ minWidth: 120 }}
          placeholder={t('Select field')}
          value={value.path || undefined}
          options={fieldOptions}
          onChange={(next: string) => {
            const nextField = fields.find((field) => field.name === next);
            value.path = next;
            // Reset operator and value when field changes — operator sets differ per field.
            value.operator = nextField?.operators[0]?.value ?? '';
            value.value = '';
          }}
        />
        <Select
          style={{ minWidth: 120 }}
          placeholder={t('Comparison')}
          value={value.operator || undefined}
          options={operatorOptions}
          onChange={(next: string) => {
            value.operator = next;
          }}
        />
        <ValueComponent
          value={value.value}
          operator={value.operator}
          onChange={(next) => {
            value.value = next;
          }}
        />
      </Space>
    );
  },
  { displayName: 'EnvVariableFilterItem' },
);
