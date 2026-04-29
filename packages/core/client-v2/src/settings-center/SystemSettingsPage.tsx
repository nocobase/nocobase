/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { UploadOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Input, Select, Space, Upload, message, theme } from 'antd';
import type { RcFile, UploadRequestOption } from 'rc-upload/lib/interface';
import mime from 'mime';
import match from 'mime-match';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import languageCodes from '../locale/languageCodes';
import { useApp } from '../hooks/useApp';
import { useSystemSettings } from '../flow/system-settings';

type UploadedAttachment = {
  id?: number;
  title?: string;
  filename?: string;
  url?: string;
};

type AttachmentStorageRules = {
  size?: number;
  mimetype?: string | string[];
};

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
  const [uploading, setUploading] = useState(false);
  const [storageRules, setStorageRules] = useState<AttachmentStorageRules | null>(null);
  const logo = Form.useWatch<UploadedAttachment>('logo', form);

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

  useEffect(() => {
    let mounted = true;

    const loadStorageRules = async () => {
      try {
        const attachmentsCollection = app.dataSourceManager?.getCollection?.('main', 'attachments');
        const storageName = attachmentsCollection?.getOption?.('storage');

        if (!storageName) {
          if (mounted) {
            setStorageRules(null);
          }
          return;
        }

        const response = await app.apiClient.request({
          url: `storages:getBasicInfo/${storageName}`,
          skipNotify: true,
        });

        if (!mounted) {
          return;
        }

        setStorageRules(response?.data?.data?.rules || null);
      } catch (error) {
        if (mounted) {
          setStorageRules(null);
        }
      }
    };

    void loadStorageRules();

    return () => {
      mounted = false;
    };
  }, [app]);

  const languageOptions = useMemo(() => {
    const currentValues = form.getFieldValue('enabledLanguages') || data?.data?.enabledLanguages || [];
    const supported = Array.from(new Set([...Object.keys(languageCodes), ...currentValues]));

    return supported.map((code) => ({
      label: `${languageCodes[code]?.label || code} (${code})`,
      value: code,
    }));
  }, [data?.data?.enabledLanguages, form]);

  const accept = useMemo(() => {
    const value = storageRules?.mimetype;
    if (!value) {
      return undefined;
    }
    return Array.isArray(value) ? value.join(',') : value;
  }, [storageRules?.mimetype]);

  const beforeUpload = async (file: RcFile) => {
    const sizeLimit = storageRules?.size;

    if (typeof sizeLimit === 'number' && sizeLimit > 0 && file.size > sizeLimit) {
      message.error(t('File size exceeds the limit'));
      return Upload.LIST_IGNORE;
    }

    const mimetypeRule = storageRules?.mimetype;
    const normalizedRule = Array.isArray(mimetypeRule) ? mimetypeRule.join(',').trim() : `${mimetypeRule || ''}`.trim();

    if (!normalizedRule || normalizedRule === '*') {
      return file;
    }

    let targetFile = file;
    if (!targetFile.type) {
      const extname = targetFile.name?.match(/\.[^.]+$/)?.[0];
      if (extname) {
        targetFile = new File([targetFile], targetFile.name, {
          type: mime.getType(extname) || 'application/octet-stream',
          lastModified: targetFile.lastModified,
        }) as RcFile;
      }
    }

    const isAllowed = normalizedRule
      .split(',')
      .filter(Boolean)
      .some((rule) => match(targetFile.type)(rule));

    if (!isAllowed) {
      message.error(t('File type is not allowed'));
      return Upload.LIST_IGNORE;
    }

    return targetFile;
  };

  const handleLogoUpload = async (options: UploadRequestOption) => {
    const { file, onError, onSuccess } = options;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file as RcFile);

      const response = await app.apiClient.request({
        url: 'attachments:create',
        method: 'post',
        data: formData,
      });

      const nextLogo = response?.data?.data;

      form.setFieldValue('logo', nextLogo);
      onSuccess?.(response?.data, file as RcFile);
    } catch (error) {
      onError?.(error);
    } finally {
      setUploading(false);
    }
  };

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
        minHeight: '100%',
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
          rules={[{ required: true, message: t('Please enter') + t('System title') }]}
        >
          <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
        </Form.Item>
        <Form.Item name="logo" label={t('Logo')}>
          <Space direction="vertical" size={token.marginSM}>
            {logo?.url ? (
              <img
                alt="system-logo"
                src={logo.url}
                style={{
                  width: 96,
                  height: 96,
                  objectFit: 'contain',
                  borderRadius: token.borderRadius,
                  border: `${token.lineWidth}px solid ${token.colorBorder}`,
                  background: token.colorBgLayout,
                  padding: token.paddingXS,
                }}
              />
            ) : null}
            <Space>
              <Upload
                showUploadList={false}
                customRequest={handleLogoUpload}
                beforeUpload={beforeUpload}
                accept={accept}
              >
                <Button loading={uploading} icon={<UploadOutlined />}>
                  {t('Upload')}
                </Button>
              </Upload>
              {logo ? (
                <Button
                  onClick={() => {
                    form.setFieldValue('logo', null);
                  }}
                >
                  {t('Delete')}
                </Button>
              ) : null}
            </Space>
          </Space>
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
