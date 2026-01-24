/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { ISchema } from '@formily/react';
import { SchemaComponent } from '@nocobase/client';

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
      'x-component': 'TextAreaWithGlobalScope',
      'x-component-props': { rows: 6 },
      default:
        '<p>Your verification code is: <strong>[code]</strong></p><p>This code will expire in [expires] minutes.</p>',
      required: true,
    },
    text: {
      title: `{{t("Email Text Template", { ns: "auth-email" })}}`,
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'TextAreaWithGlobalScope',
      'x-component-props': { rows: 4 },
      default: 'Your verification code is: [code]. This code will expire in [expires] minutes.',
      required: true,
    },
  },
} as ISchema;

export const SMTPSettings: React.FC = () => {
  return <SchemaComponent schema={schema} />;
};
