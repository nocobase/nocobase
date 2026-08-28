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
import { App, Button, Form, Input, notification as staticNotification, Space } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useT } from '../locale';
import type { DataSourceTypeOptions } from '../plugin';
import { compileLegacyTemplateText } from '../utils/compileLegacyTemplate';
import { getErrorMessage, getResponseErrorMessage } from '../utils/error';

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
  const { message, notification } = App.useApp();
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

  const normalizeValues = useCallback(
    (values: Record<string, any>) => {
      const collections: Array<{ name: string; selected?: boolean } | string> = values.collections || [];
      const options = { ...(values.options || {}) };
      if (typeof options.port === 'string' && /^\d+$/.test(options.port.trim())) {
        options.port = Number(options.port.trim());
      }
      if (options.ssl?.sslMode === 'disable') {
        options.ssl = { sslMode: 'disable' };
      }

      const normalizedValues = {
        ...values,
        options,
        collections: collections
          .filter((collection) => (typeof collection === 'string' ? true : collection.selected))
          .map((collection) => (typeof collection === 'string' ? collection : collection.name)),
      };

      return props.type.normalizeValues?.(normalizedValues) || normalizedValues;
    },
    [props.type],
  );

  const handleTestConnection = useCallback(async () => {
    setTesting(true);
    try {
      const values = await form.validateFields();
      const response = await resource.testConnection({ values: normalizeValues(values) });
      const responseErrorMessage = getResponseErrorMessage(response);
      if (responseErrorMessage) {
        throw new Error(responseErrorMessage);
      }
      message.success(t('Connection successful'));
    } catch (error) {
      const errorMessage = getErrorMessage(error, t('Connection failed'));
      (notification || staticNotification).error({
        message: t('Test Connection'),
        description: errorMessage,
      });
    } finally {
      setTesting(false);
    }
  }, [form, message, normalizeValues, notification, resource, t]);

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
      await props.onSubmitted(response?.data?.data || values);
      await view.close();
    } catch (error) {
      const errorMessage = getErrorMessage(error, t('Submit failed'));
      (notification || staticNotification).error({
        message: t('Submit failed'),
        description: errorMessage,
      });
    } finally {
      setSubmitting(false);
    }
  }, [form, normalizeValues, notification, props, resource, t, view]);

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
          rules={[
            { required: true, message: t('Data source name') },
            {
              pattern: /^[A-Za-z][A-Za-z0-9_]*$/,
              message: t(
                'Randomly generated and can be modified. Support letters, numbers and underscores, must start with a letter.',
              ),
            },
          ]}
          extra={t(
            'Randomly generated and can be modified. Support letters, numbers and underscores, must start with a letter.',
          )}
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
