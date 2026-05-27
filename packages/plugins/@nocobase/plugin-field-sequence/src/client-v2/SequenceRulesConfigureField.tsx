/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined, DownOutlined, PlusOutlined, UpOutlined } from '@ant-design/icons';
import type { FieldConfigurePropertyComponentProps } from '@nocobase/client-v2';
import { Button, Form, Input, InputNumber, Select, Space, Table } from 'antd';
import { cloneDeep } from 'lodash';
import React from 'react';
import { useT } from './locale';

const cronCycleOptions = [
  { label: '{{t("No reset")}}', value: '__none__', cron: null },
  { label: '{{t("Daily")}}', value: '0 0 * * *', cron: '0 0 * * *' },
  { label: '{{t("Every Monday")}}', value: '0 0 * * 1', cron: '0 0 * * 1' },
  { label: '{{t("Monthly")}}', value: '0 0 1 * *', cron: '0 0 1 * *' },
  { label: '{{t("Yearly")}}', value: '0 0 1 1 *', cron: '0 0 1 1 *' },
  { label: '{{t("Customize")}}', value: '__custom__', cron: '* * * * *' },
];

function compileLegacyTemplate(value: React.ReactNode, t: (key: string) => string) {
  if (typeof value !== 'string') {
    return value;
  }
  const matched = value.match(/^\s*\{\{\s*t\(["'](.+?)["']\)\s*\}\}\s*$/);
  return matched ? t(matched[1]) : value;
}

function normalizeSchemaEnum(schemaEnum: unknown, t: (key: string) => string) {
  if (!Array.isArray(schemaEnum)) {
    return [];
  }

  return schemaEnum.map((item) => {
    if (typeof item === 'object' && item !== null) {
      const option = item as { label?: React.ReactNode; value?: string | number | boolean };
      return {
        value: option.value,
        label: compileLegacyTemplate(option.label ?? option.value, t),
      };
    }
    return { value: item, label: String(item) };
  });
}

function getRuleTypeDefaults(ruleType?: Record<string, any>) {
  if (ruleType?.defaults) {
    return cloneDeep(ruleType.defaults);
  }
  return (ruleType?.fields || []).reduce((memo: Record<string, any>, field: Record<string, any>) => {
    if (field.default !== undefined) {
      memo[field.name] = cloneDeep(field.default);
    }
    return memo;
  }, {});
}

function CronCycleEditor(props: {
  value?: string | null;
  onChange?: (value?: string | null) => void;
  disabled?: boolean;
}) {
  const t = useT();
  const value = props.value ?? null;
  const matchedOption = cronCycleOptions.find((option) => option.cron === value);
  const selectedValue = matchedOption?.value || (value ? '__custom__' : '__none__');
  const customValue = selectedValue === '__custom__' ? value || '* * * * *' : undefined;

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Select
        disabled={props.disabled}
        value={selectedValue}
        options={cronCycleOptions.map((option) => ({
          value: option.value,
          label: compileLegacyTemplate(option.label, t),
        }))}
        onChange={(nextValue) => {
          const option = cronCycleOptions.find((item) => item.value === nextValue);
          props.onChange?.(option?.cron);
        }}
      />
      {selectedValue === '__custom__' ? (
        <Input
          disabled={props.disabled}
          value={customValue}
          onChange={(event) => props.onChange?.(event.target.value)}
        />
      ) : null}
    </Space>
  );
}

function SequenceRuleOptions(props: {
  name: Array<string | number>;
  rowName: number;
  ruleTypes: Array<Record<string, any>>;
  form: any;
  disabled?: boolean;
}) {
  const t = useT();
  const type = Form.useWatch([...props.name, props.rowName, 'type'], props.form);
  const ruleType = props.ruleTypes.find((item) => item.value === type) || props.ruleTypes[0];
  const fields = ruleType?.fields || [];

  if (!fields.length) {
    return null;
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      {fields.map((field: Record<string, any>) => {
        const name = [...props.name, props.rowName, 'options', field.name];
        const label = compileLegacyTemplate(field.label || field.name, t);

        if (field.component === 'InputNumber') {
          return (
            <Form.Item
              key={field.name}
              name={name}
              label={label}
              rules={field.required ? [{ required: true }] : undefined}
            >
              <InputNumber style={{ width: '100%' }} disabled={props.disabled} {...(field.componentProps || {})} />
            </Form.Item>
          );
        }

        if (field.component === 'Select') {
          return (
            <Form.Item
              key={field.name}
              name={name}
              label={label}
              rules={field.required ? [{ required: true }] : undefined}
            >
              <Select
                disabled={props.disabled}
                options={normalizeSchemaEnum(field.enum, t)}
                {...(field.componentProps || {})}
              />
            </Form.Item>
          );
        }

        if (field.component === 'CronCycle') {
          return (
            <Form.Item
              key={field.name}
              name={name}
              label={label}
              rules={field.required ? [{ required: true }] : undefined}
            >
              <CronCycleEditor disabled={props.disabled} />
            </Form.Item>
          );
        }

        return (
          <Form.Item
            key={field.name}
            name={name}
            label={label}
            rules={field.required ? [{ required: true }] : undefined}
          >
            <Input disabled={props.disabled} />
          </Form.Item>
        );
      })}
    </Space>
  );
}

export function SequenceRulesConfigureField(props: FieldConfigurePropertyComponentProps) {
  const t = useT();
  const ruleTypes = props.schema?.['x-component-props']?.ruleTypes || [];
  const defaultType = ruleTypes.find((item: Record<string, any>) => item.value === 'integer') || ruleTypes[0];
  const defaultValue = {
    type: defaultType?.value,
    options: getRuleTypeDefaults(defaultType),
  };

  return (
    <Form.Item label={props.title} tooltip={props.tooltip} required={props.schema?.required}>
      <Form.List
        name={props.namePath}
        rules={
          props.schema?.required
            ? [
                {
                  async validator(_, value) {
                    if (!value?.length) {
                      throw new Error(t('Please add at least one rule'));
                    }
                  },
                },
              ]
            : undefined
        }
      >
        {(fields, { add, move, remove }, { errors }) => (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Table
              rowKey="key"
              pagination={false}
              dataSource={fields}
              size="small"
              columns={[
                {
                  title: '',
                  width: 84,
                  render: (_, field, index) => (
                    <Space size={0}>
                      <Button
                        aria-label={t('Move up')}
                        disabled={props.disabled || index === 0}
                        icon={<UpOutlined />}
                        size="small"
                        type="text"
                        onClick={() => move(index, index - 1)}
                      />
                      <Button
                        aria-label={t('Move down')}
                        disabled={props.disabled || index === fields.length - 1}
                        icon={<DownOutlined />}
                        size="small"
                        type="text"
                        onClick={() => move(index, index + 1)}
                      />
                    </Space>
                  ),
                },
                {
                  title: t('Type'),
                  width: 180,
                  render: (_, field) => (
                    <Form.Item name={[field.name, 'type']} rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                      <Select
                        disabled={props.disabled}
                        options={ruleTypes.map((item: Record<string, any>) => ({
                          value: item.value,
                          label: compileLegacyTemplate(item.label, t),
                        }))}
                        onChange={(nextType) => {
                          const nextRuleType = ruleTypes.find((item: Record<string, any>) => item.value === nextType);
                          props.form?.setFieldValue(
                            [...props.namePath, field.name, 'options'],
                            getRuleTypeDefaults(nextRuleType),
                          );
                        }}
                      />
                    </Form.Item>
                  ),
                },
                {
                  title: t('Rule content'),
                  render: (_, field) => (
                    <SequenceRuleOptions
                      name={props.namePath}
                      rowName={field.name}
                      ruleTypes={ruleTypes}
                      form={props.form}
                      disabled={props.disabled}
                    />
                  ),
                },
                {
                  title: t('Operations'),
                  width: 96,
                  render: (_, field) => (
                    <Button
                      aria-label={t('Delete')}
                      disabled={props.disabled}
                      icon={<DeleteOutlined />}
                      size="small"
                      type="text"
                      onClick={() => remove(field.name)}
                    />
                  ),
                },
              ]}
            />
            <Form.ErrorList errors={errors} />
            <Button icon={<PlusOutlined />} disabled={props.disabled} onClick={() => add(cloneDeep(defaultValue))}>
              {t('Add rule')}
            </Button>
          </Space>
        )}
      </Form.List>
    </Form.Item>
  );
}
