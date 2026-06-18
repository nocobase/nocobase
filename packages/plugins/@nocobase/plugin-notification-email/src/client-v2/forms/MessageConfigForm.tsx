/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined, MenuOutlined, PlusOutlined } from '@ant-design/icons';
import type { MessageConfigFormProps } from '@nocobase/plugin-notification-manager/client-v2';
import { WorkflowVariableInput, WorkflowVariableTextArea } from '@nocobase/plugin-workflow/client-v2';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button, Flex, Form, Radio, theme } from 'antd';
import React from 'react';
import { useNotificationEmailTranslation } from '../locale';

function withPrefix(namePrefix: Array<string | number> | undefined, ...segments: Array<string | number>) {
  return [...(namePrefix ?? []), ...segments];
}

type AddressListProps = {
  formPath: Array<string | number>;
  title: string;
  addLabel: string;
  placeholder: string;
  requiredMessage: string;
  required?: boolean;
};

type SortableAddressRowContextValue = {
  attributes?: DraggableAttributes;
  listeners?: DraggableSyntheticListeners;
  setActivatorNodeRef?: (node: HTMLElement | null) => void;
};

const SortableAddressRowContext = React.createContext<SortableAddressRowContextValue | null>(null);

function SortableAddressRow(props: React.PropsWithChildren<{ id: string }>) {
  const { attributes, isDragging, listeners, setActivatorNodeRef, setNodeRef, transform, transition } = useSortable({
    id: props.id,
  });

  return (
    <SortableAddressRowContext.Provider value={{ attributes, listeners, setActivatorNodeRef }}>
      <div
        ref={setNodeRef}
        style={{
          transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
          transition,
          ...(isDragging ? { position: 'relative' as const, zIndex: 1 } : null),
        }}
      >
        {props.children}
      </div>
    </SortableAddressRowContext.Provider>
  );
}

function AddressSortHandle() {
  const ctx = React.useContext(SortableAddressRowContext);
  const { token } = theme.useToken();

  return (
    <span
      ref={ctx?.setActivatorNodeRef}
      {...ctx?.attributes}
      {...ctx?.listeners}
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

function AddressList(props: AddressListProps) {
  const { formPath, title, addLabel, placeholder, required, requiredMessage } = props;
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1,
      },
    }),
  );

  return (
    <Form.List
      name={formPath}
      rules={
        required
          ? [
              {
                validator: async (_rule, value) => {
                  if (Array.isArray(value) && value.filter(Boolean).length > 0) {
                    return;
                  }
                  throw new Error(requiredMessage);
                },
              },
            ]
          : undefined
      }
    >
      {(fields, { add, remove, move }, { errors }) => (
        <Form.Item
          label={title}
          required={required}
          validateStatus={errors.length ? 'error' : undefined}
          help={errors[0]}
        >
          <Flex vertical gap="small">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(event: DragEndEvent) => {
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
              }}
            >
              <SortableContext items={fields.map((field) => String(field.key))} strategy={verticalListSortingStrategy}>
                <Flex vertical gap="small">
                  {fields.map((field) => (
                    <SortableAddressRow key={field.key} id={String(field.key)}>
                      <Flex gap="small" align="center">
                        <AddressSortHandle />
                        <Form.Item name={field.name} noStyle>
                          <WorkflowVariableInput placeholder={placeholder} variableOptions={{ types: ['string'] }} />
                        </Form.Item>
                        <Button
                          type="text"
                          aria-label={title}
                          icon={<DeleteOutlined />}
                          onClick={() => remove(field.name)}
                        />
                      </Flex>
                    </SortableAddressRow>
                  ))}
                </Flex>
              </SortableContext>
            </DndContext>
            <Button icon={<PlusOutlined />} onClick={() => add('')}>
              {addLabel}
            </Button>
          </Flex>
        </Form.Item>
      )}
    </Form.List>
  );
}

export function MessageConfigForm(props: MessageConfigFormProps) {
  const { t } = useNotificationEmailTranslation();
  const contentType = Form.useWatch(withPrefix(props.namePrefix, 'contentType')) ?? 'html';

  return (
    <>
      <AddressList
        formPath={withPrefix(props.namePrefix, 'to')}
        title={t('To')}
        addLabel={t('Add email address')}
        placeholder={t('Email address')}
        requiredMessage={t('The field value is required')}
        required
      />
      <AddressList
        formPath={withPrefix(props.namePrefix, 'cc')}
        title={t('CC')}
        addLabel={t('Add email address')}
        placeholder={t('Email address')}
        requiredMessage={t('The field value is required')}
      />
      <AddressList
        formPath={withPrefix(props.namePrefix, 'bcc')}
        title={t('BCC')}
        addLabel={t('Add email address')}
        placeholder={t('Email address')}
        requiredMessage={t('The field value is required')}
      />
      <Form.Item
        name={withPrefix(props.namePrefix, 'subject')}
        label={t('Subject')}
        rules={[{ required: true, message: t('The field value is required') }]}
      >
        <WorkflowVariableInput />
      </Form.Item>
      <Form.Item name={withPrefix(props.namePrefix, 'contentType')} label={t('Content type')} initialValue="html">
        <Radio.Group
          options={[
            { label: 'HTML', value: 'html' },
            { label: t('Plain text'), value: 'text' },
          ]}
        />
      </Form.Item>
      <Form.Item
        name={withPrefix(props.namePrefix, 'html')}
        label={t('Content')}
        hidden={contentType !== 'html'}
        rules={contentType === 'html' ? [{ required: true, message: t('The field value is required') }] : undefined}
      >
        <WorkflowVariableTextArea autoSize={{ minRows: 10 }} placeholder="Hi," />
      </Form.Item>
      <Form.Item
        name={withPrefix(props.namePrefix, 'text')}
        label={t('Content')}
        hidden={contentType !== 'text'}
        rules={contentType === 'text' ? [{ required: true, message: t('The field value is required') }] : undefined}
      >
        <WorkflowVariableTextArea autoSize={{ minRows: 10 }} placeholder="Hi," />
      </Form.Item>
    </>
  );
}

export default MessageConfigForm;
