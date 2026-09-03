/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useRef, useState } from 'react';
import { App as AntdApp, Button, Flex, Form, Modal, Space, Spin } from 'antd';
import { useApp } from '@nocobase/client-v2';
import { useT } from '../../../locale';
import {
  createLLMService,
  getInitialLLMServiceFormValues,
  listLLMProviders,
  LLMServiceForm,
  LLMTestFlightButton,
  type LLMServiceFormValues,
  type ProviderOption,
} from '../../../pages/LLMServicesPage';

export const AddLLMModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ open, onClose, onSuccess }) => {
  const t = useT();
  const app = useApp();
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm<LLMServiceFormValues>();
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const selectedProvider = Form.useWatch('provider', form);
  const tRef = useRef(t);

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  useEffect(() => {
    if (!open) {
      return;
    }
    form.resetFields();
    form.setFieldsValue(getInitialLLMServiceFormValues());
    const loadProviders = async () => {
      setLoadingProviders(true);
      try {
        setProviders(await listLLMProviders(app.apiClient, (value) => tRef.current(value)));
      } finally {
        setLoadingProviders(false);
      }
    };
    loadProviders().catch(console.error);
  }, [app.apiClient, form, open]);

  const closeModal = () => {
    form.resetFields();
    onClose();
  };

  const submit = async (values: LLMServiceFormValues) => {
    setSubmitting(true);
    try {
      await createLLMService(app.apiClient, values);
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
      onCancel={closeModal}
      destroyOnClose
      width={600}
      footer={
        <Flex justify="end">
          <Space>
            {selectedProvider ? <LLMTestFlightButton form={form} /> : null}
            <Button onClick={closeModal}>{t('Cancel')}</Button>
            <Button type="primary" loading={submitting} onClick={() => form.submit()}>
              {t('Submit')}
            </Button>
          </Space>
        </Flex>
      }
    >
      <Spin spinning={loadingProviders}>
        <Form<LLMServiceFormValues> form={form} layout="vertical" onFinish={submit}>
          <LLMServiceForm providers={providers} editing={false} />
        </Form>
      </Spin>
    </Modal>
  );
};

AddLLMModal.displayName = 'AddLLMModal';
