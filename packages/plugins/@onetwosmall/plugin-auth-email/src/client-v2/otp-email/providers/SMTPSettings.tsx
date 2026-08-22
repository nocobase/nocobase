/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Form, Input, InputNumber, Select, Checkbox } from 'antd';
import React from 'react';
import { useAuthEmailTranslation } from '../../locale';

const HTML_PREVIEW_PLACEHOLDER_CODE = '123456';
const HTML_PREVIEW_PLACEHOLDER_EXPIRES = '2';

/**
 * SMTP provider settings form for v2 client.
 * Renders the SMTP configuration fields (host, port, credentials, templates)
 * as antd Form.Item components instead of v1's `@formily/react` `SchemaComponent`.
 */
export function SMTPSettings() {
  const { t } = useAuthEmailTranslation();
  const form = Form.useFormInstance();
  const htmlValue: string = Form.useWatch(['options', 'settings', 'html'], form) || '';

  const previewHtml = htmlValue
    ? htmlValue
        .replace(/\[code\]/g, HTML_PREVIEW_PLACEHOLDER_CODE)
        .replace(/\[expires\]/g, HTML_PREVIEW_PLACEHOLDER_EXPIRES)
    : '';

  return (
    <>
      <Form.Item name={['options', 'settings', 'service']} label={t('Email Service')} initialValue="custom">
        <Select
          options={[
            { label: 'Custom', value: 'custom' },
            { label: 'Gmail (SMTP)', value: 'gmail' },
            { label: 'Outlook (SMTP)', value: 'outlook' },
            { label: 'Yahoo (SMTP)', value: 'yahoo' },
            { label: '163 (SMTP)', value: '163' },
            { label: 'QQ (SMTP)', value: 'qq' },
            { label: 'QQ Enterprise (SMTP)', value: 'qq-exmail' },
          ]}
        />
      </Form.Item>
      <Form.Item
        noStyle
        shouldUpdate={(prev, next) => prev.options?.settings?.service !== next.options?.settings?.service}
      >
        {({ getFieldValue }) => {
          const service = getFieldValue(['options', 'settings', 'service']);
          const preset: Record<string, { host: string; port: number; secure: boolean }> = {
            gmail: { host: 'smtp.gmail.com', port: 587, secure: false },
            outlook: { host: 'smtp-mail.outlook.com', port: 587, secure: false },
            yahoo: { host: 'smtp.mail.yahoo.com', port: 587, secure: false },
            '163': { host: 'smtp.163.com', port: 25, secure: false },
            qq: { host: 'smtp.qq.com', port: 587, secure: false },
            'qq-exmail': { host: 'smtp.exmail.qq.com', port: 587, secure: false },
          };
          const presets = service && preset[service] ? preset[service] : null;

          return (
            <>
              <Form.Item
                name={['options', 'settings', 'host']}
                label={t('SMTP Host')}
                rules={[{ required: true, message: t('Please enter SMTP host') }]}
                initialValue={presets?.host}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name={['options', 'settings', 'port']}
                label={t('SMTP Port')}
                rules={[{ required: true, message: t('Please enter SMTP port') }]}
                initialValue={presets?.port ?? 587}
              >
                <InputNumber min={1} max={65535} />
              </Form.Item>
              <Form.Item
                name={['options', 'settings', 'secure']}
                label={t('Secure')}
                valuePropName="checked"
                initialValue={presets?.secure ?? false}
              >
                <Checkbox />
              </Form.Item>
            </>
          );
        }}
      </Form.Item>
      <Form.Item
        name={['options', 'settings', 'user']}
        label={t('Username')}
        rules={[{ required: true, message: t('Please enter username') }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name={['options', 'settings', 'pass']}
        label={t('Password')}
        rules={[{ required: true, message: t('Please enter password') }]}
      >
        <Input.Password />
      </Form.Item>
      <Form.Item
        name={['options', 'settings', 'from']}
        label={t('From Email')}
        rules={[{ required: true, message: t('Please enter from email') }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name={['options', 'settings', 'subject']}
        label={t('Email Subject')}
        rules={[{ required: true, message: t('Please enter email subject') }]}
        initialValue="Verification Code"
      >
        <Input.TextArea rows={2} />
      </Form.Item>
      <Form.Item
        name={['options', 'settings', 'html']}
        label={t('Email HTML Template')}
        rules={[{ required: true, message: t('Please enter email HTML template') }]}
        initialValue="<p>Your verification code is: <strong>[code]</strong></p><p>This code will expire in [expires] minutes.</p>"
      >
        <Input.TextArea rows={10} style={{ fontFamily: 'Consolas, Monaco, "Courier New", monospace', fontSize: 13 }} />
      </Form.Item>
      <Form.Item label={t('HTML Preview')}>
        {previewHtml ? (
          <div style={{ background: '#f5f5f5', borderRadius: 6, padding: 16 }}>
            <div
              style={{
                background: '#fff',
                borderRadius: 6,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                maxWidth: 560,
                margin: '0 auto',
              }}
            >
              <div
                className="email-preview-content"
                style={{ padding: 24, fontSize: 14, lineHeight: 1.6 }}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </div>
        ) : (
          <div
            style={{
              border: '1px solid #d9d9d9',
              borderRadius: 6,
              padding: 16,
              color: '#999',
              fontSize: 13,
              background: '#fafafa',
              textAlign: 'center',
            }}
          >
            HTML preview will appear here
          </div>
        )}
      </Form.Item>
    </>
  );
}

export default SMTPSettings;
