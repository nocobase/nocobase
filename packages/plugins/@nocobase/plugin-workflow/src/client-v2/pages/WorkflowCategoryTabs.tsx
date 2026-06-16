/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SortableCategoryTabs } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { useMemoizedFn } from 'ahooks';
import { App, Form, Input, Modal, Select, Tag } from 'antd';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useT, useWorkflowTranslation } from '../locale';

export const ALL_CATEGORY_KEY = 'all';

export type WorkflowCategory = {
  id: string | number;
  title?: string;
  color?: string;
  sort?: number;
};

const COLOR_KEYS = [
  'red',
  'magenta',
  'volcano',
  'orange',
  'gold',
  'lime',
  'green',
  'cyan',
  'blue',
  'geekblue',
  'purple',
  'default',
];

function ColorSelect(props: { value?: string; onChange?: (value: string) => void }) {
  const { t } = useTranslation();
  const options = COLOR_KEYS.map((color) => ({
    value: color,
    label: (
      <Tag color={color === 'default' ? undefined : color}>{t(color.charAt(0).toUpperCase() + color.slice(1))}</Tag>
    ),
  }));
  return <Select allowClear value={props.value} options={options} onChange={props.onChange} />;
}

export type WorkflowCategoryTabsProps = {
  activeKey: string;
  onChange: (key: string) => void;
  categories: WorkflowCategory[];
  refreshCategories: () => void;
};

export function WorkflowCategoryTabs(props: WorkflowCategoryTabsProps) {
  const { activeKey, onChange, categories, refreshCategories } = props;
  const { t } = useWorkflowTranslation();
  const compile = useT();
  const ctx = useFlowContext();
  const { modal } = App.useApp();
  const resource = ctx.api.resource('workflowCategories');

  const [editing, setEditing] = useState<WorkflowCategory | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const sortedCategories = useMemo(
    () =>
      [...categories]
        .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
        .map((category) => ({ id: category.id, label: compile(category.title), color: category.color })),
    [categories, compile],
  );

  const findCategory = useMemoizedFn((id: string | number) =>
    categories.find((category) => String(category.id) === String(id)),
  );

  const openCreate = useMemoizedFn(() => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  });

  const openEdit = useMemoizedFn((id: string | number) => {
    const category = findCategory(id);
    if (!category) {
      return;
    }
    setEditing(category);
    form.setFieldsValue({ title: category.title, color: category.color });
    setModalOpen(true);
  });

  const handleRemove = useMemoizedFn((id: string | number) => {
    const category = findCategory(id);
    if (!category) {
      return;
    }
    modal.confirm({
      title: t('Delete category'),
      content: t('Are you sure you want to delete it?'),
      async onOk() {
        await resource.destroy({ filterByTk: category.id });
        if (String(category.id) === activeKey) {
          onChange(ALL_CATEGORY_KEY);
        }
        refreshCategories();
      },
    });
  });

  const handleSort = useMemoizedFn(async (sourceId: string | number, targetId: string | number) => {
    await resource.move({ sourceId, targetId });
    refreshCategories();
  });

  const handleSubmit = useMemoizedFn(async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      if (editing) {
        await resource.update({ filterByTk: editing.id, values });
      } else {
        await resource.create({ values });
      }
      setModalOpen(false);
      refreshCategories();
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <>
      <SortableCategoryTabs
        activeKey={activeKey}
        onChange={onChange}
        allTab={{ key: ALL_CATEGORY_KEY, label: t('All') }}
        categories={sortedCategories}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={handleRemove}
        onSort={handleSort}
        menuLabels={{ edit: t('Edit category'), delete: t('Delete category') }}
      />
      <Modal
        title={editing ? t('Edit category') : t('Add category')}
        open={modalOpen}
        confirmLoading={submitting}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText={t('Submit')}
        cancelText={t('Cancel')}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label={t('Title')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="color" label={t('Color')}>
            <ColorSelect />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default WorkflowCategoryTabs;
