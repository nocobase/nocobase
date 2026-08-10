/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined, MenuOutlined, PlusOutlined } from '@ant-design/icons';
import type { FieldConfigurePropertyComponentProps } from '@nocobase/client-v2';
import { Button, Drawer, Form, Input, InputNumber, Select, Space, Table, theme } from 'antd';
import type { FormInstance, FormListFieldData, Rule } from 'antd/es/form';
import { cloneDeep, get } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
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
  const matched = value.match(/^\s*\{\{\s*t\s*\(\s*(['"])(.*?)\1(?:\s*,[\s\S]*?)?\)\s*\}\}\s*$/);
  return matched?.[2] ? t(matched[2]) : value;
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

function getRuleTypeFieldValue(ruleType: Record<string, any>, options: Record<string, any>, fieldName: string) {
  if (Object.prototype.hasOwnProperty.call(options, fieldName)) {
    return options[fieldName];
  }
  const field = (ruleType?.fields || []).find((item: Record<string, any>) => item.name === fieldName);
  return field?.default;
}

function CronCycleEditor(props: {
  value?: string | null;
  onChange?: (value?: string | null) => void;
  disabled?: boolean;
  id?: string;
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
        id={props.id}
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

function SequenceRuleOptionControl(props: {
  field: Record<string, any>;
  form: FormInstance;
  ruleType?: Record<string, any>;
  disabled?: boolean;
  id?: string;
  value?: string | number | string[] | null;
  onChange?: (value: string | number | string[] | null) => void;
}) {
  const { field, form, ruleType, disabled, id, onChange, value } = props;
  const t = useT();
  const digits = Form.useWatch('digits', form);
  const componentProps = { ...(field.componentProps || {}) };

  if (ruleType?.value === 'integer' && field.name === 'start' && Number.isFinite(Number(digits))) {
    componentProps.max = 10 ** Number(digits) - 1;
  }

  if (field.component === 'InputNumber') {
    return (
      <InputNumber
        style={{ width: '100%' }}
        disabled={disabled}
        {...componentProps}
        id={id}
        value={typeof value === 'number' ? value : null}
        onChange={(nextValue) => onChange?.(nextValue)}
      />
    );
  }

  if (field.component === 'Select') {
    return (
      <Select
        disabled={disabled}
        options={normalizeSchemaEnum(field.enum, t)}
        {...componentProps}
        id={id}
        value={value}
        onChange={(nextValue) => onChange?.(nextValue)}
      />
    );
  }

  if (field.component === 'CronCycle') {
    return (
      <CronCycleEditor
        disabled={disabled}
        id={id}
        value={typeof value === 'string' ? value : null}
        onChange={(nextValue) => onChange?.(nextValue ?? null)}
      />
    );
  }

  return (
    <Input
      disabled={disabled}
      id={id}
      value={typeof value === 'string' ? value : ''}
      onChange={(event) => onChange?.(event.target.value)}
    />
  );
}

function SequenceRuleOptionsForm(props: { form: FormInstance; ruleType?: Record<string, any>; disabled?: boolean }) {
  const t = useT();
  const fields = props.ruleType?.fields || [];

  return (
    <>
      {fields.map((field: Record<string, any>) => {
        const label = compileLegacyTemplate(field.label || field.name, t);
        const rules: Rule[] = [];
        if (field.required) {
          rules.push({ required: true, message: t('Required') });
        }
        if (field.componentProps?.mode === 'multiple') {
          rules.push({
            validator: async (_: unknown, value: unknown[]) => {
              if (field.required && (!Array.isArray(value) || value.length === 0)) {
                throw new Error(t('Required'));
              }
            },
          });
        }
        return (
          <Form.Item key={field.name} name={field.name} label={label} rules={rules}>
            <SequenceRuleOptionControl
              field={field}
              form={props.form}
              ruleType={props.ruleType}
              disabled={props.disabled}
            />
          </Form.Item>
        );
      })}
    </>
  );
}

function SequenceRuleOptionsSummary(props: { ruleType?: Record<string, any>; options?: Record<string, any> }) {
  const t = useT();
  const fields = props.ruleType?.fields || [];
  const options = props.options || {};
  const visibleFields = fields.filter((field: Record<string, any>) => {
    return getRuleTypeFieldValue(props.ruleType || {}, options, field.name) !== undefined;
  });

  if (!props.ruleType || !visibleFields.length) {
    return null;
  }

  const renderValue = (field: Record<string, any>) => {
    const value = getRuleTypeFieldValue(props.ruleType || {}, options, field.name);
    if (field.component === 'Select' && Array.isArray(value)) {
      const labels = normalizeSchemaEnum(field.enum, t)
        .filter((option) => value.includes(option.value))
        .map((option) => option.label);
      return labels.join(', ');
    }
    if (field.component === 'CronCycle') {
      const option = cronCycleOptions.find((item) => item.cron === value);
      return compileLegacyTemplate(option?.label || (value ? 'Customize' : 'No reset'), t);
    }
    return value;
  };

  return (
    <Space size="large" wrap>
      {visibleFields.map((field: Record<string, any>) => (
        <dl key={field.name} style={{ margin: 0, padding: 0 }}>
          <dt>{compileLegacyTemplate(field.label || field.name, t)}</dt>
          <dd style={{ marginBottom: 0 }}>
            <code>{renderValue(field)}</code>
          </dd>
        </dl>
      ))}
    </Space>
  );
}

export function SequenceRulesConfigureField(props: FieldConfigurePropertyComponentProps) {
  const t = useT();
  const { token } = theme.useToken();
  const [configForm] = Form.useForm();
  const [draggingIndex, setDraggingIndex] = useState<number>();
  const [editingRule, setEditingRule] = useState<{
    fieldName: number;
    initialValues: Record<string, any>;
    title: React.ReactNode;
    ruleType?: Record<string, any>;
  }>();
  const ruleTypes = useMemo(() => props.schema?.['x-component-props']?.ruleTypes || [], [props.schema]);
  const defaultType = ruleTypes.find((item: Record<string, any>) => item.value === 'integer') || ruleTypes[0];
  const defaultValue = {
    type: defaultType?.value,
    options: getRuleTypeDefaults(defaultType),
  };
  const ruleTypeOptions = useMemo(
    () =>
      ruleTypes.map((item: Record<string, any>) => ({
        value: item.value,
        label: compileLegacyTemplate(item.label, t),
      })),
    [ruleTypes, t],
  );

  const openConfigure = (field: FormListFieldData) => {
    const row = get(props.form?.getFieldValue(props.namePath), field.name);
    const ruleType = ruleTypes.find((item: Record<string, any>) => item.value === row?.type) || defaultType;
    setEditingRule({
      fieldName: field.name,
      initialValues: { ...getRuleTypeDefaults(ruleType), ...(row?.options || {}) },
      title: compileLegacyTemplate(ruleType?.label || ruleType?.value, t),
      ruleType,
    });
  };

  const closeConfigure = () => {
    setEditingRule(undefined);
    configForm.resetFields();
  };

  const submitConfigure = async () => {
    const values = await configForm.validateFields();
    if (!editingRule) {
      return;
    }
    const previousOptions = get(props.form?.getFieldValue(props.namePath), [editingRule.fieldName, 'options']) || {};
    const preservedOptions =
      editingRule.ruleType?.value === 'integer' && previousOptions.key != null ? { key: previousOptions.key } : {};
    props.form?.setFieldValue([...props.namePath, editingRule.fieldName, 'options'], {
      ...preservedOptions,
      ...values,
    });
    closeConfigure();
  };

  useEffect(() => {
    if (!editingRule) {
      return;
    }
    configForm.resetFields();
    configForm.setFieldsValue(editingRule.initialValues);
  }, [configForm, editingRule]);

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
          <>
            <Table
              rowKey="key"
              pagination={false}
              dataSource={fields}
              size="small"
              footer={() => (
                <Button
                  block
                  icon={<PlusOutlined />}
                  disabled={props.disabled}
                  type="dashed"
                  onClick={() => add(cloneDeep(defaultValue))}
                >
                  {t('Add rule')}
                </Button>
              )}
              onRow={(field) => {
                const dropIndex = fields.findIndex((item) => item.key === field.key);
                return {
                  onDragOver: (event) => event.preventDefault(),
                  onDrop: () => {
                    if (draggingIndex === undefined || draggingIndex === dropIndex) {
                      return;
                    }
                    move(draggingIndex, dropIndex);
                    setDraggingIndex(undefined);
                  },
                  onDragEnd: () => setDraggingIndex(undefined),
                };
              }}
              columns={[
                {
                  title: '',
                  width: 50,
                  align: 'center',
                  render: (_, field, index) => (
                    <span
                      aria-label={t('Drag sort')}
                      draggable={!props.disabled}
                      onDragStart={() => setDraggingIndex(index)}
                      style={{
                        color: 'var(--ant-color-text-tertiary)',
                        cursor: props.disabled ? 'not-allowed' : 'grab',
                        display: 'inline-flex',
                      }}
                    >
                      <MenuOutlined />
                    </span>
                  ),
                },
                {
                  title: t('Type'),
                  width: 260,
                  render: (_, field) => (
                    <Form.Item name={[field.name, 'type']} rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                      <Select
                        disabled={props.disabled}
                        options={ruleTypeOptions}
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
                    <Form.Item shouldUpdate noStyle>
                      {() => {
                        const row = get(props.form?.getFieldValue(props.namePath), field.name);
                        const ruleType =
                          ruleTypes.find((item: Record<string, any>) => item.value === row?.type) || defaultType;
                        return <SequenceRuleOptionsSummary ruleType={ruleType} options={row?.options} />;
                      }}
                    </Form.Item>
                  ),
                },
                {
                  title: t('Operations'),
                  width: 180,
                  render: (_, field) => (
                    <Space>
                      <Button disabled={props.disabled} size="small" type="link" onClick={() => openConfigure(field)}>
                        {t('Configure')}
                      </Button>
                      <Button
                        aria-label={t('Delete')}
                        disabled={props.disabled}
                        icon={<DeleteOutlined />}
                        size="small"
                        type="text"
                        onClick={() => remove(field.name)}
                      />
                    </Space>
                  ),
                },
              ]}
            />
            <Form.ErrorList errors={errors} />
            <Drawer
              destroyOnClose
              title={editingRule?.title}
              open={!!editingRule}
              width={640}
              zIndex={token.zIndexPopupBase + 1000}
              onClose={closeConfigure}
              footer={
                <Button type="primary" onClick={submitConfigure}>
                  {t('Submit')}
                </Button>
              }
            >
              <Form
                key={`${editingRule?.fieldName}-${editingRule?.ruleType?.value}`}
                form={configForm}
                initialValues={editingRule?.initialValues}
                layout="vertical"
                preserve={false}
              >
                <SequenceRuleOptionsForm form={configForm} ruleType={editingRule?.ruleType} disabled={props.disabled} />
              </Form>
            </Drawer>
          </>
        )}
      </Form.List>
    </Form.Item>
  );
}
