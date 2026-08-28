/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import { Button, Form, Popover, Space, theme } from 'antd';
import { DeleteOutlined, MenuOutlined, PlusOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent, DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FilterDynamicComponent } from '@nocobase/plugin-workflow/client-v2';
import type { AIEmployeeApprovalMode } from '../../../types';
import { useT } from '../../../../locale';
import { WorkflowUserSelect } from './UserInput';

type AssigneeValue = string | number | Array<string | number> | { filter?: Record<string, unknown> };

type AssigneeInputProps = {
  value?: AssigneeValue;
  onChange?: (value?: AssigneeValue) => void;
};

const SortableAssigneeRowContext = React.createContext<{
  attributes?: DraggableAttributes;
  listeners?: DraggableSyntheticListeners;
  setActivatorNodeRef?: (node: HTMLElement | null) => void;
} | null>(null);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isQueryAssignee(value: unknown): value is { filter?: Record<string, unknown> } {
  return isRecord(value);
}

function AssigneeInput({ value, onChange }: AssigneeInputProps) {
  const { token } = theme.useToken();
  const queryClassName = css`
    width: 100%;
    padding: ${token.paddingSM}px;
    border: ${token.lineWidth}px dashed ${token.colorBorder};
  `;

  if (isQueryAssignee(value)) {
    return (
      <div className={queryClassName}>
        <FilterDynamicComponent
          collection="users"
          value={value.filter ?? {}}
          onChange={(filter) => onChange?.({ filter: filter ?? {} })}
        />
      </div>
    );
  }

  return <WorkflowUserSelect value={value} onChange={(nextValue) => onChange?.(nextValue as AssigneeValue)} />;
}

function AssigneeSortHandle({ disabled }: { disabled?: boolean }) {
  const t = useT();
  const { token } = theme.useToken();
  const dragContext = React.useContext(SortableAssigneeRowContext);

  return (
    <Button
      ref={disabled ? undefined : dragContext?.setActivatorNodeRef}
      aria-label={t('Drag sort')}
      disabled={disabled}
      icon={<MenuOutlined />}
      type="text"
      size="small"
      {...(disabled ? {} : dragContext?.attributes)}
      {...(disabled ? {} : dragContext?.listeners)}
      style={{
        color: token.colorTextTertiary,
        cursor: disabled ? 'not-allowed' : 'grab',
      }}
    />
  );
}

function SortableAssigneeRow({
  children,
  className,
  disabled,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  id: string;
}) {
  const { attributes, isDragging, listeners, setActivatorNodeRef, setNodeRef, transform, transition } = useSortable({
    disabled,
    id,
  });
  const { token } = theme.useToken();

  return (
    <SortableAssigneeRowContext.Provider value={{ attributes, listeners, setActivatorNodeRef }}>
      <Space
        ref={setNodeRef}
        align="center"
        className={className}
        size={token.marginXXS}
        style={{
          position: isDragging ? 'relative' : undefined,
          zIndex: isDragging ? 1 : undefined,
          transform: CSS.Transform.toString(transform),
          transition,
        }}
      >
        {children}
      </Space>
    </SortableAssigneeRowContext.Provider>
  );
}

export function Assignees() {
  const t = useT();
  const form = Form.useFormInstance();
  const { token } = theme.useToken();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1,
      },
    }),
  );
  const [open, setOpen] = useState(false);
  const watchedRequiresApproval = Form.useWatch(['config', 'requiresApproval'], form) as
    | AIEmployeeApprovalMode
    | undefined;
  const requiresApproval =
    watchedRequiresApproval ??
    (form.getFieldValue(['config', 'requiresApproval']) as AIEmployeeApprovalMode | undefined);
  const visible = requiresApproval && requiresApproval !== 'no_required';

  if (!visible) {
    return null;
  }

  const listClassName = css`
    width: 100%;
  `;
  const itemClassName = css`
    width: 100%;

    &.ant-space.ant-space-horizontal {
      flex-wrap: nowrap;
    }

    > .ant-space-item:nth-child(2) {
      flex: 1 1 auto;
      min-width: 0;
    }

    .ant-form-item {
      margin-bottom: 0;
    }
  `;

  return (
    <Form.Item label={t('Assignees')} required>
      <Form.List
        name={['config', 'assignees']}
        rules={[
          {
            validator: async (_, value?: AssigneeValue[]) => {
              if (!Array.isArray(value) || value.length === 0) {
                throw new Error(t('Assignees is required'));
              }
            },
          },
        ]}
      >
        {(fields, operations, meta) => (
          <Space direction="vertical" className={listClassName} size={token.marginXS}>
            <DndContext
              collisionDetection={closestCenter}
              sensors={sensors}
              onDragEnd={(event: DragEndEvent) => {
                const { active, over } = event;
                if (!over || active.id === over.id) {
                  return;
                }
                const activeIndex = fields.findIndex((field) => String(field.key) === String(active.id));
                const overIndex = fields.findIndex((field) => String(field.key) === String(over.id));
                if (activeIndex < 0 || overIndex < 0) {
                  return;
                }
                operations.move(activeIndex, overIndex);
              }}
            >
              <SortableContext items={fields.map((field) => String(field.key))} strategy={verticalListSortingStrategy}>
                <Space direction="vertical" className={listClassName} size={token.marginXS}>
                  {fields.map((field) => (
                    <SortableAssigneeRow
                      key={field.key}
                      className={itemClassName}
                      disabled={fields.length < 2}
                      id={String(field.key)}
                    >
                      <AssigneeSortHandle disabled={fields.length < 2} />
                      <Form.Item name={[field.name]} noStyle>
                        <AssigneeInput />
                      </Form.Item>
                      <Button
                        type="text"
                        size="small"
                        aria-label="delete"
                        icon={<DeleteOutlined />}
                        onClick={() => operations.remove(field.name)}
                      />
                    </SortableAssigneeRow>
                  ))}
                </Space>
              </SortableContext>
            </DndContext>
            <Form.ErrorList errors={meta.errors} />
            <Popover
              trigger="click"
              open={open}
              onOpenChange={setOpen}
              placement="bottom"
              content={
                <Space direction="vertical">
                  <Button
                    type="text"
                    onClick={() => {
                      operations.add(null);
                      setOpen(false);
                    }}
                  >
                    {t('Select users')}
                  </Button>
                  <Button
                    type="text"
                    onClick={() => {
                      operations.add({ filter: {} });
                      setOpen(false);
                    }}
                  >
                    {t('Query users')}
                  </Button>
                </Space>
              }
            >
              <Button block type="dashed" aria-label={t('Add assignee')} icon={<PlusOutlined />}>
                {t('Add assignee')}
              </Button>
            </Popover>
          </Space>
        )}
      </Form.List>
    </Form.Item>
  );
}

export default Assignees;
