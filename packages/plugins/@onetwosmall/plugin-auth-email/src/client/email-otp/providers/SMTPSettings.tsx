/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { ISchema, observer, useField } from '@formily/react';
import { SchemaComponent } from '@nocobase/client';

const HtmlPreview = observer(() => {
  const field = useField();
  const html = field.parent?.value?.html || '';

  const previewHtml = html ? html.replace(/\[code\]/g, '123456').replace(/\[expires\]/g, '2') : '';

  if (!previewHtml) {
    return (
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
    );
  }

  return (
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
  );
});

HtmlPreview.displayName = 'HtmlPreview';

const schema = {
  type: 'object',
  properties: {
    service: {
      title: `{{t("Email Service", { ns: "auth-email" })}}`,
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      enum: [
        { label: 'Custom', value: 'custom' },
        { label: 'Gmail (SMTP)', value: 'gmail' },
        { label: 'Outlook (SMTP)', value: 'outlook' },
        { label: 'Yahoo (SMTP)', value: 'yahoo' },
        { label: '163 (SMTP)', value: '163' },
        { label: 'QQ (SMTP)', value: 'qq' },
        { label: 'QQ Enterprise (SMTP)', value: 'qq-exmail' },
      ],
      default: 'custom',
    },
    host: {
      title: `{{t("SMTP Host", { ns: "auth-email" })}}`,
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'TextAreaWithGlobalScope',
      required: true,
      'x-reactions': {
        dependencies: ['service'],
        fulfill: {
          state: {
            value:
              '{{ $deps[0] === "gmail" ? "smtp.gmail.com" : $deps[0] === "outlook" ? "smtp-mail.outlook.com" : $deps[0] === "yahoo" ? "smtp.mail.yahoo.com" : $deps[0] === "163" ? "smtp.163.com" : $deps[0] === "qq" ? "smtp.qq.com" : $deps[0] === "qq-exmail" ? "smtp.exmail.qq.com" : $self.value }}',
          },
        },
      },
    },
    port: {
      title: `{{t("SMTP Port", { ns: "auth-email" })}}`,
      type: 'number',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      required: true,
      default: 587,
      'x-reactions': {
        dependencies: ['service'],
        fulfill: {
          state: {
            value:
              '{{ $deps[0] === "gmail" ? 587 : $deps[0] === "outlook" ? 587 : $deps[0] === "yahoo" ? 587 : $deps[0] === "163" ? 25 : $deps[0] === "qq" ? 587 : $deps[0] === "qq-exmail" ? 587 : $self.value }}',
          },
        },
      },
    },
    secure: {
      title: `{{t("Secure", { ns: "auth-email" })}}`,
      type: 'boolean',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
      'x-reactions': {
        dependencies: ['service'],
        fulfill: {
          state: {
            value:
              '{{ $deps[0] === "gmail" ? false : $deps[0] === "outlook" ? false : $deps[0] === "yahoo" ? false : $deps[0] === "163" ? false : $deps[0] === "qq" ? false : $deps[0] === "qq-exmail" ? false : $self.value }}',
          },
        },
      },
    },
    user: {
      title: `{{t("Username", { ns: "auth-email" })}}`,
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'TextAreaWithGlobalScope',
      required: true,
    },
    pass: {
      title: `{{t("Password", { ns: "auth-email" })}}`,
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'TextAreaWithGlobalScope',
      'x-component-props': { password: true },
      required: true,
    },
    from: {
      title: `{{t("From Email", { ns: "auth-email" })}}`,
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'TextAreaWithGlobalScope',
      required: true,
    },
    subject: {
      title: `{{t("Email Subject", { ns: "auth-email" })}}`,
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'TextAreaWithGlobalScope',
      default: 'Verification Code',
      required: true,
    },
    html: {
      title: `{{t("Email HTML Template", { ns: "auth-email" })}}`,
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
      'x-component-props': {
        rows: 10,
        style: { fontFamily: 'Consolas, Monaco, "Courier New", monospace', fontSize: 13 },
      },
      default:
        '<p>Your verification code is: <strong>[code]</strong></p><p>This code will expire in [expires] minutes.</p>',
      required: true,
    },
    preview: {
      type: 'void',
      'x-component': 'HtmlPreview',
    },
  },
} as ISchema;

import { useAuthTranslation } from '../../locale';

export const SMTPSettings: React.FC = () => {
  const { t } = useAuthTranslation();
  return <SchemaComponent scope={{ t }} components={{ HtmlPreview }} schema={schema} />;
};
