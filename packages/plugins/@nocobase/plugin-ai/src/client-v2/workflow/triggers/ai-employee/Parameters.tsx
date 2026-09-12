/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined, EditOutlined, MenuOutlined, PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import React, { useEffect, useMemo, useState } from 'react';
import { Button, Checkbox, Flex, Form, Input, Modal, Select, Space, Tooltip, Typography, theme } from 'antd';
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

type SortableListField = {
  key: React.Key;
  name: number;
};

type FormListOperations = {
  add: (defaultValue?: unknown, insertIndex?: number) => void;
  remove: (index: number | number[]) => void;
  move: (from: number, to: number) => void;
};

type SortableItemContextValue = {
  attributes?: DraggableAttributes;
  listeners?: DraggableSyntheticListeners;
  setActivatorNodeRef?: (node: HTMLElement | null) => void;
};

const SortableItemContext = React.createContext<SortableItemContextValue | null>(null);

function toParameter(values: ParameterFormValues): AIEmployeeTriggerParameter {
  return {
    name: values.name ?? '',
    type: values.type ?? 'string',
    description: values.description,
    enumOptions: values.type === 'enum' ? values.enumOptions ?? [] : undefined,
    required: values.required,
  };
}

function useListDragSensors() {
  return useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
}

function moveByDragEvent(event: DragEndEvent, fields: SortableListField[], move: FormListOperations['move']) {
  const { active, over } = event;
  if (!over || active.id === over.id) {
    return;
  }
  const currentIds = fields.map((field) => String(field.key));
  const fromIndex = currentIds.indexOf(String(active.id));
  const toIndex = currentIds.indexOf(String(over.id));
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
    return;
  }
  move(fromIndex, toIndex);
}

function SortableItem(props: React.PropsWithChildren<{ id: string }>) {
  const { attributes, isDragging, listeners, setActivatorNodeRef, setNodeRef, transform, transition } = useSortable({
    id: props.id,
  });

  return (
    <SortableItemContext.Provider value={{ attributes, listeners, setActivatorNodeRef }}>
      <div
        ref={setNodeRef}
        style={{
          transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
          transition,
          ...(isDragging ? { position: 'relative', zIndex: 1 } : null),
        }}
      >
        {props.children}
      </div>
    </SortableItemContext.Provider>
  );
}

function SortHandle({ label }: { label: string }) {
  const ctx = React.useContext(SortableItemContext);
  const { token } = theme.useToken();

  return (
    <span
      ref={ctx?.setActivatorNodeRef}
      {...ctx?.attributes}
      {...ctx?.listeners}
      aria-label={label}
      style={{
        alignItems: 'center',
        color: token.colorTextTertiary,
        cursor: 'grab',
        display: 'inline-flex',
      }}
    >
      <MenuOutlined />
    </span>
  );
}

function ParameterItemFrame({ children }: React.PropsWithChildren) {
  const { token } = theme.useToken();

  return (
    <div
      style={{
        background: token.colorBgContainer,
        border: `${token.lineWidth}px solid ${token.colorBorderSecondary}`,
        borderRadius: token.borderRadiusLG,
        padding: token.paddingSM,
      }}
    >
      {children}
    </div>
  );
}

function ParameterModal({ open, initialValue, onCancel, onSubmit }: ParameterModalProps) {
  const t = useT();
  const [form] = Form.useForm<ParameterFormValues>();
  const sensors = useListDragSensors();
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
                <Flex vertical gap="small">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => moveByDragEvent(event, fields, operations.move)}
                  >
                    <SortableContext
                      items={fields.map((field) => String(field.key))}
                      strategy={verticalListSortingStrategy}
                    >
                      <Flex vertical gap="small">
                        {fields.map((field) => (
                          <SortableItem key={field.key} id={String(field.key)}>
                            <Flex gap="small" align="center">
                              <SortHandle label={t('Drag to sort')} />
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
                            </Flex>
                          </SortableItem>
                        ))}
                      </Flex>
                    </SortableContext>
                  </DndContext>
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
                </Flex>
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
  const { token } = theme.useToken();

  if (!value) {
    return null;
  }

  return (
    <Space size="middle">
      <Typography.Text strong style={{ marginLeft: token.margin }}>
        {value.name}
      </Typography.Text>
      <Typography.Text type="secondary">{value.type}</Typography.Text>
      {value.required ? <Typography.Text type="danger">{t('required')}</Typography.Text> : null}
    </Space>
  );
}

function ParameterActions({
  field,
  index,
  operations,
  onEdit,
}: {
  field: SortableListField;
  index: number;
  operations: FormListOperations;
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
  const sensors = useListDragSensors();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const parameters = (Form.useWatch(['config', 'parameters'], form) ??
    form.getFieldValue(['config', 'parameters']) ??
    []) as AIEmployeeTriggerParameter[];
  const currentParameter = editingIndex == null ? undefined : parameters[editingIndex];

  return (
    <Form.Item label={t('Parameters')} extra={t('The parameters required by the tool')} required>
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
          <Flex vertical gap="small">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(event) => moveByDragEvent(event, fields, operations.move)}
            >
              <SortableContext items={fields.map((field) => String(field.key))} strategy={verticalListSortingStrategy}>
                <Flex vertical gap="small">
                  {fields.map((field, index) => (
                    <SortableItem key={field.key} id={String(field.key)}>
                      <ParameterItemFrame>
                        <Flex gap="small" align="center">
                          <SortHandle label={t('Drag to sort')} />
                          <Form.Item name={[field.name]} noStyle>
                            <ParameterSummary />
                          </Form.Item>
                          <div style={{ flex: 1, minWidth: 0 }} />
                          <ParameterActions
                            field={field}
                            index={index}
                            operations={operations}
                            onEdit={setEditingIndex}
                          />
                        </Flex>
                      </ParameterItemFrame>
                    </SortableItem>
                  ))}
                </Flex>
              </SortableContext>
            </DndContext>
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
          </Flex>
        )}
      </Form.List>
    </Form.Item>
  );
}

export default Parameters;
