/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined, MenuOutlined } from '@ant-design/icons';
import type { MessageConfigFormProps } from '@nocobase/plugin-notification-manager/client-v2';
import { UserAddition, UserSelect } from '@nocobase/plugin-notification-manager/client-v2';
import { WorkflowVariableInput, WorkflowVariableTextArea } from '@nocobase/plugin-workflow/client-v2';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button, Flex, Form, InputNumber, theme } from 'antd';
import React from 'react';
import { useInAppMessageTranslation, useT } from '../locale';

function withPrefix(namePrefix: Array<string | number> | undefined, ...segments: Array<string | number>) {
  return [...(namePrefix ?? []), ...segments];
}

type ReceiverValue = string | { filter?: Record<string, unknown> };
type SortableReceiverRowContextValue = {
  attributes?: DraggableAttributes;
  listeners?: DraggableSyntheticListeners;
  setActivatorNodeRef?: (node: HTMLElement | null) => void;
};

const SortableReceiverRowContext = React.createContext<SortableReceiverRowContextValue | null>(null);

function SortableReceiverRow(props: React.PropsWithChildren<{ id: string }>) {
  const { attributes, isDragging, listeners, setActivatorNodeRef, setNodeRef, transform, transition } = useSortable({
    id: props.id,
  });

  return (
    <SortableReceiverRowContext.Provider value={{ attributes, listeners, setActivatorNodeRef }}>
      <div
        ref={setNodeRef}
        style={{
          transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
          transition,
          width: '100%',
          ...(isDragging ? { position: 'relative' as const, zIndex: 1 } : null),
        }}
      >
        {props.children}
      </div>
    </SortableReceiverRowContext.Provider>
  );
}

function ReceiverSortHandle() {
  const ctx = React.useContext(SortableReceiverRowContext);
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

export function MessageConfigForm(props: MessageConfigFormProps) {
  const { t } = useInAppMessageTranslation();
  const compileT = useT();
  const form = Form.useFormInstance();
  const receiversPath = withPrefix(props.namePrefix, 'receivers');
  const watchedReceivers = Form.useWatch(receiversPath, form);
  const receivers = Array.isArray(watchedReceivers) ? (watchedReceivers as ReceiverValue[]) : [];
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1,
      },
    }),
  );

  return (
    <>
      <Form.List
        name={receiversPath}
        rules={[
          {
            validator: async (_rule, value) => {
              if (Array.isArray(value) && value.filter(Boolean).length > 0) {
                return;
              }
              throw new Error(t('The field value is required'));
            },
          },
        ]}
      >
        {(fields, operations, { errors }) => (
          <Form.Item
            label={t('Receivers')}
            required
            extra={compileT(
              'When select receivers from node result, only support ID of user (or IDs array of users). Others will not match any user.',
            )}
            validateStatus={errors.length ? 'error' : undefined}
            help={errors[0]}
          >
            <Flex vertical gap="small" style={{ width: '100%' }}>
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
                  operations.move(fromIndex, toIndex);
                }}
              >
                <SortableContext
                  items={fields.map((field) => String(field.key))}
                  strategy={verticalListSortingStrategy}
                >
                  <Flex vertical gap="small" style={{ width: '100%' }}>
                    {fields.map((field) => (
                      <SortableReceiverRow key={field.key} id={String(field.key)}>
                        <Flex gap="small" align="center" style={{ width: '100%' }}>
                          <ReceiverSortHandle />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Form.Item name={field.name} noStyle>
                              <UserSelect variableOptions={props.variableOptions} />
                            </Form.Item>
                          </div>
                          <Button
                            type="text"
                            icon={<DeleteOutlined />}
                            aria-label={t('Receivers')}
                            onClick={() => operations.remove(field.name)}
                          />
                        </Flex>
                      </SortableReceiverRow>
                    ))}
                  </Flex>
                </SortableContext>
              </DndContext>
              <UserAddition value={receivers} onChange={(next) => form.setFieldValue(receiversPath, next)} />
            </Flex>
          </Form.Item>
        )}
      </Form.List>
      <Form.Item
        name={withPrefix(props.namePrefix, 'title')}
        label={t('Message title')}
        rules={[{ required: true, message: t('The field value is required') }]}
      >
        <WorkflowVariableInput variableOptions={{ types: ['string'] }} />
      </Form.Item>
      <Form.Item
        name={withPrefix(props.namePrefix, 'content')}
        label={t('Message content')}
        rules={[{ required: true, message: t('The field value is required') }]}
      >
        <WorkflowVariableTextArea autoSize={{ minRows: 10 }} placeholder="Hi," delimiters={['{{{', '}}}']} />
      </Form.Item>
      <Form.Item
        name={withPrefix(props.namePrefix, 'options', 'url')}
        label={t('Details page for desktop')}
        extra={compileT(
          'Support two types of links: internal links and external links. If using an internal link, the link starts with "/", for example, "/admin". If using an external link, the link starts with "http", for example, "https://example.com".',
        )}
      >
        <WorkflowVariableInput variableOptions={{ types: ['string'] }} />
      </Form.Item>
      <Form.Item
        name={withPrefix(props.namePrefix, 'options', 'mobileUrl')}
        label={t('Details page for mobile')}
        extra={compileT(
          'Support two types of links: internal links and external links. If using an internal link, the link starts with "/", for example, "/m". If using an external link, the link starts with "http", for example, "https://example.com".',
        )}
      >
        <WorkflowVariableInput variableOptions={{ types: ['string'] }} />
      </Form.Item>
      <Form.Item
        name={withPrefix(props.namePrefix, 'options', 'duration')}
        label={t('Close after')}
        extra={compileT('Unit is second. Will not close automatically when set to empty.')}
        initialValue={5}
      >
        <InputNumber />
      </Form.Item>
    </>
  );
}

export default MessageConfigForm;
