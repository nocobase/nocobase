/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DrawerFormLayout } from '@nocobase/client-v2';
import { randomId, useFlowContext, useFlowView } from '@nocobase/flow-engine';
import { App, Button, Form, Input, Space } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useT } from '../locale';
import type { DataSourceTypeOptions } from '../plugin';
import { compileLegacyTemplateText } from '../utils/compileLegacyTemplate';

export interface DataSourceFormProps {
  mode: 'create' | 'edit';
  type: DataSourceTypeOptions;
  initialValues?: Record<string, any>;
  onSubmitted: (record?: Record<string, any>) => void;
}

export function DataSourceForm(props: DataSourceFormProps) {
  const t = useT();
  const ctx = useFlowContext();
  const view = useFlowView();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [testing, setTesting] = useState(false);
  const resource = useMemo(() => ctx.api.resource('dataSources'), [ctx.api]);
  const initialValues = useMemo(
    () =>
      props.mode === 'create'
        ? {
            ...props.type.defaultValues,
            type: props.type.name,
            key: randomId('d_'),
          }
        : props.initialValues || {},
    [props.initialValues, props.mode, props.type],
  );
  const SettingsForm = props.type.SettingsForm;

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  const loadCollections = useCallback(
    async (key: string) => {
      const response = await resource.readTables({
        values: {
          dataSourceKey: key,
        },
      });
      return response?.data;
    },
    [resource],
  );

  const normalizeValues = useCallback((values: Record<string, any>) => {
    const collections: Array<{ name: string; selected?: boolean } | string> = values.collections || [];
    return {
      ...values,
      collections: collections
        .filter((collection) => (typeof collection === 'string' ? true : collection.selected))
        .map((collection) => (typeof collection === 'string' ? collection : collection.name)),
    };
  }, []);

  const handleTestConnection = useCallback(async () => {
    const values = await form.validateFields();
    setTesting(true);
    try {
      await resource.testConnection({ values: normalizeValues(values) });
      message.success(t('Connection successful'));
    } finally {
      setTesting(false);
    }
  }, [form, message, normalizeValues, resource, t]);

  const handleSubmit = useCallback(async () => {
    const values = normalizeValues(await form.validateFields());
    setSubmitting(true);
    try {
      let response;
      if (props.mode === 'create') {
        response = await resource.create({ values });
      } else {
        response = await resource.update({ filterByTk: props.initialValues?.key, values });
      }
      props.onSubmitted(response?.data?.data || values);
    } finally {
      setSubmitting(false);
    }
  }, [form, normalizeValues, props, resource]);

  const typeLabel = compileLegacyTemplateText(props.type.label || props.type.name, t);
  const title = `${props.mode === 'create' ? t('Add new') : t('Edit')} - ${typeLabel}`;

  return (
    <DrawerFormLayout
      title={title}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText={t('Submit')}
      cancelText={t('Cancel')}
      footer={
        <Space>
          {!props.type.disableTestConnection ? (
            <Button loading={testing} onClick={handleTestConnection}>
              {t('Test Connection')}
            </Button>
          ) : null}
          <Button onClick={() => view.close()}>{t('Cancel')}</Button>
          <Button type="primary" loading={submitting} onClick={handleSubmit}>
            {t('Submit')}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" initialValues={initialValues}>
        <Form.Item name="type" hidden>
          <Input />
        </Form.Item>
        <Form.Item
          name="key"
          label={t('Data source name')}
          rules={[{ required: true, message: t('Data source name') }]}
        >
          <Input disabled={props.mode === 'edit'} />
        </Form.Item>
        <Form.Item
          name="displayName"
          label={t('Data source display name')}
          rules={[{ required: true, message: t('Data source display name') }]}
        >
          <Input />
        </Form.Item>
        {SettingsForm ? (
          <SettingsForm
            mode={props.mode}
            type={props.type}
            initialValues={initialValues}
            loadCollections={loadCollections}
          />
        ) : null}
      </Form>
    </DrawerFormLayout>
  );
}
