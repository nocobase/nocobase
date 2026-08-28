/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined, MenuOutlined, PlusOutlined } from '@ant-design/icons';
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent, DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  WorkflowTypedVariableInput,
  WorkflowVariableInput,
  WorkflowVariableTextArea,
} from '@nocobase/plugin-workflow/client-v2';
import { Button, Checkbox, Col, Form, Radio, Row, Space, theme } from 'antd';
import type { NamePath } from 'antd/es/form/interface';
import React from 'react';

import {
  CONTENT_TYPE_HTML,
  CONTENT_TYPE_TEXT,
  EMAIL_VALUE_TYPES,
  SMTP_HOST_VALUE_TYPES,
  SMTP_PASSWORD_VALUE_TYPES,
  SMTP_PORT_VALUE_TYPES,
  SMTP_SECURE_VALUE_TYPES,
  SMTP_USER_VALUE_TYPES,
  isFileRecordVariableMatch,
} from '../constants';
import { useT } from '../locale';

const SortableRowContext = React.createContext<{
  attributes?: DraggableAttributes;
  listeners?: DraggableSyntheticListeners;
  setActivatorNodeRef?: (node: HTMLElement | null) => void;
} | null>(null);

function SortHandle({ disabled }: { disabled?: boolean }) {
  const t = useT();
  const dragContext = React.useContext(SortableRowContext);

  return (
    <Button
      ref={disabled ? undefined : dragContext?.setActivatorNodeRef}
      aria-label={t('Drag sort')}
      disabled={disabled}
      icon={<MenuOutlined />}
      type="text"
      {...(disabled ? {} : dragContext?.attributes)}
      {...(disabled ? {} : dragContext?.listeners)}
      style={{
        color: 'var(--ant-color-text-tertiary)',
        cursor: disabled ? 'not-allowed' : 'grab',
      }}
    />
  );
}

function SortableRow({ children, disabled, id }: { children: React.ReactNode; disabled?: boolean; id: string }) {
  const { attributes, isDragging, listeners, setActivatorNodeRef, setNodeRef, transform, transition } = useSortable({
    disabled,
    id,
  });
  const { token } = theme.useToken();

  return (
    <SortableRowContext.Provider value={{ attributes, listeners, setActivatorNodeRef }}>
      <Row
        ref={setNodeRef}
        gutter={token.marginXS}
        align="middle"
        style={{
          position: isDragging ? 'relative' : undefined,
          zIndex: isDragging ? 1 : undefined,
          transform: CSS.Transform.toString(transform),
          transition,
        }}
      >
        {children}
      </Row>
    </SortableRowContext.Provider>
  );
}

function ArrayAddButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <Button block icon={<PlusOutlined />} onClick={onClick} type="dashed">
      {children}
    </Button>
  );
}

function AddressListField({ name, label, required }: { name: NamePath; label: React.ReactNode; required?: boolean }) {
  const t = useT();
  const form = Form.useFormInstance();
  const sensors = useSensors(useSensor(PointerSensor));
  const skipNextEmptyValidationRef = React.useRef(false);

  const skipNextEmptyValidation = () => {
    skipNextEmptyValidationRef.current = true;
    setTimeout(() => {
      skipNextEmptyValidationRef.current = false;
    });
  };

  return (
    <Form.Item label={label} required={required}>
      <Form.List
        name={name}
        rules={[
          {
            validator: async (_, value: unknown[]) => {
              if (!required || value?.filter(Boolean).length) {
                return;
              }
              if (skipNextEmptyValidationRef.current) {
                skipNextEmptyValidationRef.current = false;
                return;
              }
              throw new Error(t('Please enter at least one email address'));
            },
          },
        ]}
      >
        {(fields, { add, move, remove }, { errors }) => {
          const items = fields.map((field) => String(field.key));
          const handleDragEnd = (event: DragEndEvent) => {
            const { active, over } = event;
            if (!over || active.id === over.id) {
              return;
            }
            const oldIndex = items.indexOf(String(active.id));
            const newIndex = items.indexOf(String(over.id));
            if (oldIndex < 0 || newIndex < 0) {
              return;
            }
            move(oldIndex, newIndex);
          };

          return (
            <Space direction="vertical" style={{ width: '100%' }}>
              {fields.length ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={items} strategy={verticalListSortingStrategy}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {fields.map((field) => (
                        <SortableRow key={field.key} id={String(field.key)} disabled={fields.length < 2}>
                          <Col>
                            <SortHandle disabled={fields.length < 2} />
                          </Col>
                          <Col flex="auto">
                            <Form.Item name={field.name} noStyle>
                              <WorkflowTypedVariableInput types={EMAIL_VALUE_TYPES} placeholder={t('Email address')} />
                            </Form.Item>
                          </Col>
                          <Col>
                            <Button
                              aria-label={t('Delete')}
                              icon={<DeleteOutlined />}
                              onClick={() => remove(field.name)}
                            />
                          </Col>
                        </SortableRow>
                      ))}
                    </Space>
                  </SortableContext>
                </DndContext>
              ) : null}
              <ArrayAddButton
                onClick={() => {
                  skipNextEmptyValidation();
                  add('');
                  form.setFields([{ name, errors: [] }]);
                }}
              >
                {t('Add email address')}
              </ArrayAddButton>
              <Form.ErrorList errors={errors} />
            </Space>
          );
        }}
      </Form.List>
    </Form.Item>
  );
}

function AttachmentListField() {
  const t = useT();
  const sensors = useSensors(useSensor(PointerSensor));
  const variableOptions = {
    types: [isFileRecordVariableMatch],
  };

  return (
    <Form.Item
      label={t('Attachments')}
      extra={t('Only variables that resolve to file collection records are supported.')}
    >
      <Form.List name={['config', 'attachments']}>
        {(fields, { add, move, remove }) => {
          const items = fields.map((field) => String(field.key));
          const handleDragEnd = (event: DragEndEvent) => {
            const { active, over } = event;
            if (!over || active.id === over.id) {
              return;
            }
            const oldIndex = items.indexOf(String(active.id));
            const newIndex = items.indexOf(String(over.id));
            if (oldIndex < 0 || newIndex < 0) {
              return;
            }
            move(oldIndex, newIndex);
          };

          return (
            <Space direction="vertical" style={{ width: '100%' }}>
              {fields.length ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={items} strategy={verticalListSortingStrategy}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {fields.map((field) => (
                        <SortableRow key={field.key} id={String(field.key)} disabled={fields.length < 2}>
                          <Col>
                            <SortHandle disabled={fields.length < 2} />
                          </Col>
                          <Col flex="auto">
                            <Form.Item name={field.name} noStyle>
                              <WorkflowVariableInput
                                readOnly
                                variableOptions={variableOptions}
                                placeholder={t('File record')}
                              />
                            </Form.Item>
                          </Col>
                          <Col>
                            <Button
                              aria-label={t('Delete')}
                              icon={<DeleteOutlined />}
                              onClick={() => remove(field.name)}
                            />
                          </Col>
                        </SortableRow>
                      ))}
                    </Space>
                  </SortableContext>
                </DndContext>
              ) : null}
              <ArrayAddButton onClick={() => add(null)}>{t('Add attachment')}</ArrayAddButton>
            </Space>
          );
        }}
      </Form.List>
    </Form.Item>
  );
}

function SmtpProviderFields() {
  const t = useT();
  const { token } = theme.useToken();

  return (
    <>
      <Row gutter={token.marginSM}>
        <Col span={12}>
          <Form.Item
            name={['config', 'provider', 'host']}
            label={t('SMTP host')}
            rules={[{ required: true }]}
            initialValue=""
          >
            <WorkflowTypedVariableInput types={SMTP_HOST_VALUE_TYPES} placeholder="smtp.example.com" />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item
            name={['config', 'provider', 'port']}
            label={t('Port')}
            rules={[{ required: true }]}
            initialValue={465}
          >
            <WorkflowTypedVariableInput types={SMTP_PORT_VALUE_TYPES} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item
            name={['config', 'provider', 'secure']}
            label={t('Secure')}
            extra={t('In most cases, if using port 465, set it to true; otherwise, set it to false.')}
            initialValue={true}
          >
            <WorkflowTypedVariableInput types={SMTP_SECURE_VALUE_TYPES} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={token.marginSM}>
        <Col span={12}>
          <Form.Item name={['config', 'provider', 'auth', 'user']} label={t('User')} initialValue="">
            <WorkflowTypedVariableInput types={SMTP_USER_VALUE_TYPES} placeholder="example@domain.com" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['config', 'provider', 'auth', 'pass']} label={t('Password')} initialValue="">
            <WorkflowTypedVariableInput types={SMTP_PASSWORD_VALUE_TYPES} />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
}

function ContentField() {
  const t = useT();
  const form = Form.useFormInstance();
  const contentType = Form.useWatch(['config', 'contentType'], form) ?? CONTENT_TYPE_HTML;

  if (contentType === CONTENT_TYPE_TEXT) {
    return (
      <Form.Item name={['config', 'text']} label={t('Content')}>
        <WorkflowVariableTextArea autoSize={{ minRows: 10 }} placeholder="Hi," />
      </Form.Item>
    );
  }

  return (
    <Form.Item name={['config', 'html']} label={t('Content')}>
      <WorkflowVariableTextArea autoSize={{ minRows: 10 }} placeholder="Hi," />
    </Form.Item>
  );
}

export function MailerFieldset() {
  const t = useT();

  return (
    <>
      <SmtpProviderFields />

      <Form.Item name={['config', 'from']} label={t('From')} rules={[{ required: true }]} initialValue="">
        <WorkflowTypedVariableInput types={EMAIL_VALUE_TYPES} placeholder="noreply <example@domain.com>" />
      </Form.Item>

      <AddressListField name={['config', 'to']} label={t('To')} required />
      <AddressListField name={['config', 'cc']} label={t('CC')} />
      <AddressListField name={['config', 'bcc']} label={t('BCC')} />

      <Form.Item name={['config', 'subject']} label={t('Subject')}>
        <WorkflowVariableInput />
      </Form.Item>

      <Form.Item name={['config', 'contentType']} label={t('Content type')} initialValue={CONTENT_TYPE_HTML}>
        <Radio.Group
          options={[
            { label: 'HTML', value: CONTENT_TYPE_HTML },
            { label: t('Plain text'), value: CONTENT_TYPE_TEXT },
          ]}
        />
      </Form.Item>

      <ContentField />

      <AttachmentListField />

      <Form.Item name={['config', 'ignoreFail']} valuePropName="checked">
        <Checkbox>{t('Ignore failed sending and continue workflow')}</Checkbox>
      </Form.Item>
    </>
  );
}

export default MailerFieldset;
