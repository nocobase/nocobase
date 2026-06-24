/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Button, Checkbox, Form, Input, Modal, Select, Space, Tooltip, Typography, type FormListFieldData } from 'antd';
import {
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  UpOutlined,
} from '@ant-design/icons';
import { TRIGGER_PARAMETER_NAME_ERROR, TRIGGER_PARAMETER_NAME_PATTERN, TRIGGER_PARAMETER_TYPES } from '../../constants';
import type { AIEmployeeTriggerParameter, TriggerParameterType } from '../../types';
import { useT } from '../../../locale';

type ParameterModalProps = {
  open: boolean;
  initialValue?: AIEmployeeTriggerParameter;
  onCancel: () => void;
  onSubmit: (value: AIEmployeeTriggerParameter) => void;
};

type ParameterFormValues = {
  name?: string;
  type?: TriggerParameterType;
  description?: string;
  enumOptions?: string[];
  required?: boolean;
};

function toParameter(values: ParameterFormValues): AIEmployeeTriggerParameter {
  return {
    name: values.name ?? '',
    type: values.type ?? 'string',
    description: values.description,
    enumOptions: values.type === 'enum' ? values.enumOptions ?? [] : undefined,
    required: values.required,
  };
}

function ParameterModal({ open, initialValue, onCancel, onSubmit }: ParameterModalProps) {
  const t = useT();
  const [form] = Form.useForm<ParameterFormValues>();
  const watchedType = Form.useWatch('type', form);
  const type = watchedType ?? form.getFieldValue('type') ?? initialValue?.type;
  const typeOptions = useMemo(() => TRIGGER_PARAMETER_TYPES.map((item) => ({ label: item, value: item })), []);

  useEffect(() => {
    if (open) {
      form.setFieldsValue(initialValue ?? { type: 'string' });
    } else {
      form.resetFields();
    }
  }, [form, initialValue, open]);

  return (
    <Modal
      open={open}
      title={t('Add parameter')}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      onOk={async () => {
        const values = await form.validateFields();
        onSubmit(toParameter(values));
        form.resetFields();
      }}
      okText={t('Submit')}
      cancelText={t('Cancel')}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label={t('Parameter name')}
          rules={[
            { required: true },
            {
              pattern: TRIGGER_PARAMETER_NAME_PATTERN,
              message: TRIGGER_PARAMETER_NAME_ERROR,
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="type" label={t('Parameter type')} rules={[{ required: true }]} initialValue="string">
          <Select options={typeOptions} />
        </Form.Item>
        <Form.Item name="description" label={t('Parameter description')}>
          <Input.TextArea />
        </Form.Item>
        {type === 'enum' ? (
          <Form.Item label={t('Options')} required>
            <Form.List
              name="enumOptions"
              rules={[
                {
                  validator: async (_, value?: string[]) => {
                    if (!Array.isArray(value) || value.length === 0) {
                      throw new Error(t('Options is required'));
                    }
                  },
                },
              ]}
            >
              {(fields, operations, meta) => (
                <Space direction="vertical">
                  {fields.map((field, index) => (
                    <Space key={field.key} align="start">
                      <Button
                        type="text"
                        size="small"
                        aria-label={t('Move up')}
                        icon={<UpOutlined />}
                        disabled={index === 0}
                        onClick={() => operations.move(index, index - 1)}
                      />
                      <Button
                        type="text"
                        size="small"
                        aria-label={t('Move down')}
                        icon={<DownOutlined />}
                        disabled={index === fields.length - 1}
                        onClick={() => operations.move(index, index + 1)}
                      />
                      <Form.Item name={[field.name]} rules={[{ required: true }]} noStyle>
                        <Input />
                      </Form.Item>
                      <Button
                        type="text"
                        size="small"
                        aria-label={t('Delete')}
                        icon={<DeleteOutlined />}
                        onClick={() => operations.remove(field.name)}
                      />
                    </Space>
                  ))}
                  <Form.ErrorList errors={meta.errors} />
                  <Button
                    block
                    type="dashed"
                    aria-label={t('Add option')}
                    icon={<PlusOutlined />}
                    onClick={() => operations.add('')}
                  >
                    {t('Add option')}
                  </Button>
                </Space>
              )}
            </Form.List>
          </Form.Item>
        ) : null}
        <Form.Item name="required" valuePropName="checked">
          <Checkbox>{t('Required')}</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );
}

function ParameterSummary({ value }: { value?: AIEmployeeTriggerParameter }) {
  const t = useT();

  if (!value) {
    return null;
  }

  return (
    <Space size="middle">
      <Typography.Text strong>{value.name}</Typography.Text>
      <Typography.Text type="secondary">{value.type}</Typography.Text>
      {value.required ? <Typography.Text type="danger">{t('required')}</Typography.Text> : null}
    </Space>
  );
}

function ParameterActions({
  field,
  index,
  fields,
  operations,
  onEdit,
}: {
  field: FormListFieldData;
  index: number;
  fields: FormListFieldData[];
  operations: Parameters<NonNullable<React.ComponentProps<typeof Form.List>['children']>>[1];
  onEdit: (index: number) => void;
}) {
  const t = useT();
  const form = Form.useFormInstance();
  const parameter = form.getFieldValue(['config', 'parameters', field.name]) as AIEmployeeTriggerParameter | undefined;

  return (
    <Space>
      {parameter?.description ? (
        <Tooltip title={parameter.description}>
          <QuestionCircleOutlined />
        </Tooltip>
      ) : null}
      <Button type="text" size="small" aria-label={t('Edit')} icon={<EditOutlined />} onClick={() => onEdit(index)} />
      <Button
        type="text"
        size="small"
        aria-label={t('Move up')}
        icon={<UpOutlined />}
        disabled={index === 0}
        onClick={() => operations.move(index, index - 1)}
      />
      <Button
        type="text"
        size="small"
        aria-label={t('Move down')}
        icon={<DownOutlined />}
        disabled={index === fields.length - 1}
        onClick={() => operations.move(index, index + 1)}
      />
      <Button
        type="text"
        size="small"
        aria-label={t('Delete')}
        icon={<DeleteOutlined />}
        onClick={() => operations.remove(field.name)}
      />
    </Space>
  );
}

export function Parameters() {
  const t = useT();
  const form = Form.useFormInstance();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const parameters = (Form.useWatch(['config', 'parameters'], form) ??
    form.getFieldValue(['config', 'parameters']) ??
    []) as AIEmployeeTriggerParameter[];
  const currentParameter = editingIndex == null ? undefined : parameters[editingIndex];

  return (
    <Form.Item label={t('Parameters')} tooltip={t('The parameters required by the tool')} required>
      <Form.List
        name={['config', 'parameters']}
        rules={[
          {
            validator: async (_, value?: AIEmployeeTriggerParameter[]) => {
              if (!Array.isArray(value)) {
                throw new Error(t('Parameters is required'));
              }
            },
          },
        ]}
      >
        {(fields, operations, meta) => (
          <Space direction="vertical">
            {fields.map((field, index) => (
              <Space key={field.key} align="start">
                <Form.Item name={[field.name]} noStyle>
                  <ParameterSummary />
                </Form.Item>
                <ParameterActions
                  field={field}
                  index={index}
                  fields={fields}
                  operations={operations}
                  onEdit={setEditingIndex}
                />
              </Space>
            ))}
            <Form.ErrorList errors={meta.errors} />
            <Button
              block
              type="dashed"
              aria-label={t('Add parameter')}
              icon={<PlusOutlined />}
              onClick={() => setAdding(true)}
            >
              {t('Add parameter')}
            </Button>
            <ParameterModal
              open={adding || editingIndex !== null}
              initialValue={currentParameter}
              onCancel={() => {
                setAdding(false);
                setEditingIndex(null);
              }}
              onSubmit={(parameter) => {
                if (editingIndex == null) {
                  operations.add(parameter);
                } else {
                  operations.remove(editingIndex);
                  operations.add(parameter, editingIndex);
                }
                setAdding(false);
                setEditingIndex(null);
              }}
            />
          </Space>
        )}
      </Form.List>
    </Form.Item>
  );
}

export default Parameters;
