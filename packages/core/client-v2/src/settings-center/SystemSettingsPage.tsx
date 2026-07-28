/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Alert, Button, Form, Input, Select, theme } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AttachmentUpload } from '../components/AttachmentUpload';
import languageCodes from '../locale/languageCodes';
import { useApp } from '../hooks/useApp';
import { useSystemSettings } from '../flow/system-settings';

/**
 * `System settings` 的最小 v2 表单页面。
 *
 * 首版只支持标题、Logo 与启用语言三项核心配置，
 * 保存时继续复用 `systemSettings:put`。
 */
export const SystemSettingsPage = () => {
  const app = useApp();
  const { token } = theme.useToken();
  const { t } = useTranslation();
  const { data, loading, error, mutate } = useSystemSettings();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    const settings = data?.data;
    if (!settings) {
      return;
    }

    form.setFieldsValue({
      raw_title: settings.raw_title,
      logo: settings.logo || null,
      enabledLanguages: settings.enabledLanguages || [],
    });
  }, [data?.data, form]);

  const languageOptions = useMemo(() => {
    const currentValues = form.getFieldValue('enabledLanguages') || data?.data?.enabledLanguages || [];
    const supported = Array.from(new Set([...Object.keys(languageCodes), ...currentValues]));

    return supported.map((code) => ({
      label: `${languageCodes[code]?.label || code} (${code})`,
      value: code,
    }));
  }, [data?.data?.enabledLanguages, form]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const payload = {
      raw_title: values.raw_title,
      logo: values.logo || null,
      enabledLanguages: values.enabledLanguages || [],
    };

    setSubmitting(true);

    try {
      const response = await app.apiClient.request({
        url: 'systemSettings:put',
        method: 'post',
        data: payload,
      });

      mutate({
        data: response?.data,
        error: undefined,
      });

      message.success(t('Saved successfully'));

      const defaultLang = payload.enabledLanguages?.[0] || 'en-US';
      const currentLocale = app.apiClient.auth.getLocale?.() || app.apiClient.auth.locale;

      if (payload.enabledLanguages.length < 2 && currentLocale !== defaultLang) {
        app.apiClient.auth.setLocale('');
        window.location.reload();
        return;
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        background: token.colorBgContainer,
        borderRadius: token.borderRadiusLG,
        padding: token.paddingLG,
      }}
    >
      {error ? (
        <Alert
          showIcon
          type="error"
          message={t('Failed to load system settings')}
          description={error?.message || String(error)}
          style={{ marginBottom: token.marginLG }}
        />
      ) : null}
      <Form form={form} layout="vertical" disabled={loading || submitting}>
        <Form.Item
          name="raw_title"
          label={t('System title')}
          rules={[{ required: true, message: t('Please enter') + ' ' + t('System title') }]}
        >
          <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
        </Form.Item>
        <Form.Item name="logo" label={t('Logo')}>
          <AttachmentUpload preview={{ width: 96, height: 96, fit: 'contain' }} />
        </Form.Item>
        <Form.Item name="enabledLanguages" label={t('Enabled languages')} rules={[{ type: 'array', min: 1 }]}>
          <Select mode="multiple" options={languageOptions} />
        </Form.Item>
        <Button type="primary" onClick={() => void handleSubmit()} loading={submitting}>
          {t('Submit')}
        </Button>
      </Form>
    </div>
  );
};

export default SystemSettingsPage;
