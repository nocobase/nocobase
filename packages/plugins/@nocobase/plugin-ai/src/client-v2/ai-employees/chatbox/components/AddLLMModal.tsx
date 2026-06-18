/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { App as AntdApp, Button, Form, Input, Modal, Select, Spin, Space } from 'antd';
import { useApp } from '@nocobase/client-v2';
import { randomId } from '@nocobase/flow-engine';
import { useT } from '../../../locale';

type ProviderItem = {
  name: string;
  title?: string;
  supportedModel?: string[];
};

type ListLLMProvidersResource = {
  listLLMProviders: () => Promise<{
    data?: {
      data?: unknown;
    };
  }>;
};

type FormValues = {
  name: string;
  provider: string;
  title?: string;
  baseURL?: string;
  enabledModels?: string[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const normalizeProvider = (value: unknown): ProviderItem | null => {
  if (!isRecord(value) || typeof value.name !== 'string') {
    return null;
  }
  return {
    name: value.name,
    title: typeof value.title === 'string' ? value.title : undefined,
    supportedModel: Array.isArray(value.supportedModel)
      ? value.supportedModel.filter((item): item is string => typeof item === 'string')
      : [],
  };
};

export const AddLLMModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ open, onClose, onSuccess }) => {
  const t = useT();
  const app = useApp();
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm<FormValues>();
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const provider = Form.useWatch('provider', form);
  const selectedProvider = useMemo(() => providers.find((item) => item.name === provider), [provider, providers]);

  useEffect(() => {
    if (!open) {
      return;
    }
    form.setFieldsValue({
      name: randomId('v_'),
    });
    const loadProviders = async () => {
      setLoadingProviders(true);
      try {
        const resource = app.apiClient.resource('ai') as unknown as ListLLMProvidersResource;
        const response = await resource.listLLMProviders();
        const data = response.data?.data;
        const nextProviders = Array.isArray(data) ? data.map(normalizeProvider).filter(Boolean) : [];
        setProviders(nextProviders);
      } finally {
        setLoadingProviders(false);
      }
    };
    loadProviders().catch(console.error);
  }, [app.apiClient, form, open]);

  useEffect(() => {
    if (!selectedProvider) {
      return;
    }
    const currentTitle = form.getFieldValue('title');
    if (!currentTitle) {
      form.setFieldValue('title', t(selectedProvider.title || selectedProvider.name));
    }
  }, [form, selectedProvider, t]);

  const submit = async () => {
    const values = await form.validateFields();
    const enabledModels = values.enabledModels || [];
    setSubmitting(true);
    try {
      await app.apiClient.resource('llmServices').create({
        values: {
          name: values.name,
          provider: values.provider,
          title: values.title,
          options: values.baseURL ? { baseURL: values.baseURL } : {},
          enabledModels: enabledModels.map((model) => ({
            label: model,
            value: model,
          })),
        },
      });
      message.success(t('Saved successfully'));
      form.resetFields();
      onSuccess();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={t('Add LLM service')}
      open={open}
      onCancel={onClose}
      destroyOnClose
      footer={
        <Space>
          <Button onClick={onClose}>{t('Cancel')}</Button>
          <Button type="primary" loading={submitting} onClick={submit}>
            {t('Submit')}
          </Button>
        </Space>
      }
    >
      <Spin spinning={loadingProviders}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="provider" label={t('Provider')} rules={[{ required: true }]}>
            <Select
              options={providers.map((item) => ({
                value: item.name,
                label: t(item.title || item.name),
              }))}
            />
          </Form.Item>
          <Form.Item name="title" label={t('Title')}>
            <Input />
          </Form.Item>
          <Form.Item
            name="baseURL"
            label={t('Base URL')}
            tooltip={t('Base URL is optional, leave blank to use default (recommended)')}
          >
            <Input />
          </Form.Item>
          <Form.Item name="enabledModels" label={t('Enabled Models')} rules={[{ required: true }]}>
            <Select
              mode="tags"
              disabled={!selectedProvider}
              options={(selectedProvider?.supportedModel || []).map((model) => ({
                value: model,
                label: model,
              }))}
            />
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
};

AddLLMModal.displayName = 'AddLLMModal';
