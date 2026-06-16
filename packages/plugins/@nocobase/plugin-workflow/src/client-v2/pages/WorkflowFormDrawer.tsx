/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DrawerFormLayout } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { useMemoizedFn } from 'ahooks';
import { Card, Form, Input, InputNumber, Select, Space, Spin, Tag, Typography, theme } from 'antd';
import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { EXECUTION_STATUS_OPTIONS, EXECUTION_STATUS_OPTIONS_MAP } from '../../common/executionStatus';
import { SyncModeSelect } from '../components/SyncModeSelect';
import { TimeoutInput } from '../components/TimeoutInput';
import { useT, useWorkflowTranslation } from '../locale';
import type PluginWorkflowClientV2 from '../plugin';

export type WorkflowCategoryOption = { value: string | number; label: string };

export type WorkflowRecord = {
  id: number | string;
  title?: string;
  type?: string;
  sync?: boolean;
  description?: string;
  enabled?: boolean;
  config?: Record<string, any>;
  options?: Record<string, any>;
  categories?: Array<{ id: string | number }>;
  [key: string]: any;
};

export type WorkflowFormDrawerProps = {
  mode: 'create' | 'edit';
  /** Pre-selected trigger type for create mode (optional). */
  type?: string;
  plugin: PluginWorkflowClientV2;
  record?: WorkflowRecord;
  categoryOptions: WorkflowCategoryOption[];
  onSubmitted: () => void;
};

export function WorkflowFormDrawer(props: WorkflowFormDrawerProps) {
  const { mode, plugin, record, categoryOptions, onSubmitted } = props;
  const { t } = useWorkflowTranslation();
  const compile = useT();
  const ctx = useFlowContext();
  const { token } = theme.useToken();
  const resource = ctx.api.resource('workflows');
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const triggerOptions = useMemo(() => {
    const options = Array.from(plugin.triggers.getEntities()).map(([value, opt]) => ({
      value,
      label: opt?.title ? compile(opt.title) : String(value),
      description: opt?.description ? compile(opt.description) : undefined,
    }));
    // Keep an existing workflow's type selectable in edit mode even if its trigger plugin hasn't exposed a v2 surface
    // yet.
    if (mode === 'edit' && record?.type && !options.some((item) => item.value === record.type)) {
      options.push({ value: record.type, label: record.type, description: undefined });
    }
    return options.sort((a, b) => String(a.label).localeCompare(String(b.label)));
  }, [plugin, compile, mode, record]);

  const deleteStatusOptions = useMemo(
    () =>
      EXECUTION_STATUS_OPTIONS.filter((option) => Boolean(option.value)).map((option) => ({
        value: option.value,
        label: compile(option.label),
        color: option.color,
        description: option.description ? compile(option.description) : undefined,
      })),
    [compile],
  );

  const initialValues = useMemo(() => {
    if (mode === 'edit') {
      return {
        title: record?.title,
        type: record?.type,
        sync: record?.sync ?? false,
        description: record?.description,
        categories: (record?.categories ?? []).map((category) => category.id),
        options: record?.options ?? {},
      };
    }
    return { type: props.type, sync: false, options: {}, config: {} };
  }, [mode, record, props.type]);

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  const watchedType = (Form.useWatch('type', form) as string | undefined) ?? props.type;
  const triggerOption = useMemo(() => plugin.getTriggerOptions(watchedType), [plugin, watchedType]);
  const syncLocked = triggerOption?.sync != null;

  useEffect(() => {
    if (syncLocked) {
      form.setFieldValue('sync', triggerOption.sync);
    }
  }, [syncLocked, triggerOption, form]);

  const ConfigForm = useMemo(() => {
    if (mode !== 'create') {
      return null;
    }
    const loader = triggerOption?.PresetFieldsetLoader;
    return loader ? lazy(loader) : null;
  }, [mode, triggerOption]);

  // Switching trigger type discards the previous type's `config` payload — each trigger owns its own config shape.
  const handleTypeChange = useMemoizedFn(() => {
    form.setFieldValue('config', {});
  });

  const handleSubmit = useMemoizedFn(async () => {
    const raw = await form.validateFields();
    setSubmitting(true);
    try {
      if (mode === 'create') {
        await resource.create({
          values: {
            title: raw.title,
            type: raw.type,
            sync: Boolean(raw.sync),
            current: true,
            config: raw.config ?? {},
            description: raw.description,
            categories: raw.categories ?? [],
            options: raw.options ?? {},
          },
        });
      } else {
        // Only send the fields this form owns; `config`/`type` are not edited here, so they are never overwritten.
        // `options` renders all of its keys, so the round-trip cannot drop one.
        await resource.update({
          filterByTk: record.id,
          values: {
            title: raw.title,
            sync: Boolean(raw.sync),
            description: raw.description,
            categories: raw.categories ?? [],
            options: raw.options ?? {},
          },
        });
      }
      onSubmitted();
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <DrawerFormLayout
      title={mode === 'create' ? t('Add new') : t('Edit')}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText={t('Submit')}
      cancelText={t('Cancel')}
    >
      <Form form={form} layout="vertical" initialValues={initialValues}>
        <Form.Item name="title" label={t('Title')} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="type" label={t('Trigger type')} rules={[{ required: true }]}>
          <Select
            options={triggerOptions}
            disabled={mode === 'edit'}
            onChange={handleTypeChange}
            showSearch
            optionFilterProp="label"
            popupMatchSelectWidth
            optionRender={(option) => (
              <Space direction="vertical">
                <Tag color="gold">{option.data?.label}</Tag>
                {option.data?.description ? (
                  <Typography.Text type="secondary" style={{ whiteSpace: 'normal' }}>
                    {option.data.description}
                  </Typography.Text>
                ) : null}
              </Space>
            )}
          />
        </Form.Item>
        {/* Trigger-specific config sits in its own titled, bordered group
            (v1's "Trigger configuration" Fieldset). Only rendered when the
            selected trigger type ships a create-config form. */}
        {ConfigForm ? (
          <div style={{ marginBottom: token.marginLG }}>
            <div style={{ marginBottom: token.marginXS, fontWeight: 600 }}>{`${t('Trigger configuration')}:`}</div>
            <div
              style={{
                padding: token.padding,
                border: `${token.lineWidth}px solid ${token.colorBorderSecondary}`,
                borderRadius: token.borderRadiusLG,
              }}
            >
              <Suspense fallback={<Spin />}>
                <ConfigForm />
              </Suspense>
            </div>
          </div>
        ) : null}
        <Form.Item
          name="sync"
          label={t('Execute mode')}
          extra={t(
            'Execute workflow asynchronously or synchronously based on trigger type, and could not be changed after created.',
          )}
        >
          {/* Execute mode is fixed after creation — disabled in edit mode (v1 parity),
              and also when the trigger type forces a sync mode. */}
          <SyncModeSelect disabled={syncLocked || mode === 'edit'} />
        </Form.Item>
        <Form.Item name="categories" label={t('Category')}>
          <Select mode="multiple" allowClear options={categoryOptions} optionFilterProp="label" />
        </Form.Item>
        <Form.Item name="description" label={t('Description')}>
          <Input.TextArea autoSize={{ minRows: 2 }} />
        </Form.Item>
        {/* Title sits above an always-visible bordered group (matches v1's
            "Advance options" Fieldset). Not collapsible — the option fields are
            always mounted and register, removing any partial-submit risk. */}
        <Form.Item label={t('Advance options')}>
          <Card size="small">
            <Form.Item
              name={['options', 'timeout']}
              label={t('Timeout settings')}
              extra={t(
                '0 means unlimited. If you set any other value and the execution is still not completed when the timeout is reached, the execution plan will be terminated and the remaining nodes will not be executed. Time spent in queue is not counted; timing starts only after it first enters a processor.',
              )}
              initialValue={0}
            >
              <TimeoutInput />
            </Form.Item>
            <Form.Item
              name={['options', 'stackLimit']}
              label={t('Maximum number of cycling triggers')}
              extra={t(
                'The triggers of same workflow by some node (create, update and sub-flow etc.) more than this number will be ignored. Large number may cause performance issues. Please use with caution.',
              )}
              initialValue={1}
            >
              <InputNumber min={1} precision={0} style={{ width: '50%' }} />
            </Form.Item>
            <Form.Item
              name={['options', 'deleteExecutionOnStatus']}
              label={t('Auto delete history when execution is on end status')}
            >
              <Select
                mode="multiple"
                allowClear
                options={deleteStatusOptions}
                optionFilterProp="label"
                optionRender={(option) => (
                  <Space>
                    <Tag color={option.data?.color}>{option.data?.label}</Tag>
                    {option.data?.description ? <span>{option.data.description}</span> : null}
                  </Space>
                )}
                tagRender={({ value, label, closable, onClose }) => (
                  <Tag
                    color={EXECUTION_STATUS_OPTIONS_MAP[String(value)]?.color}
                    closable={closable}
                    onClose={onClose}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                  >
                    {label}
                  </Tag>
                )}
              />
            </Form.Item>
          </Card>
        </Form.Item>
      </Form>
    </DrawerFormLayout>
  );
}

export default WorkflowFormDrawer;
