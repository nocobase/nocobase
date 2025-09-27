/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Form } from 'antd';
import { useField } from '@formily/react';

export type FormItemLiteProps = React.ComponentProps<typeof Form.Item>;

const statusMap: Record<string, 'success' | 'warning' | 'error' | 'validating' | undefined> = {
  success: 'success',
  warning: 'warning',
  error: 'error',
  pending: 'validating',
};

export const FormItemLite: React.FC<FormItemLiteProps> = ({ children, ...rest }) => {
  const field: any = useField();

  // 可见性控制
  if (field?.visible === false || field?.display === 'none' || field?.display === 'hidden') {
    return null;
  }

  const label = rest.label ?? field?.title;
  const required = rest.required ?? field?.required;

  const validateStatus = rest.validateStatus ?? (field?.validateStatus ? statusMap[field.validateStatus] : undefined);

  const help =
    rest.help ??
    field?.feedbackText ??
    (Array.isArray(field?.selfErrors) && field.selfErrors[0]) ??
    (Array.isArray(field?.selfWarnings) && field.selfWarnings[0]) ??
    undefined;

  const extra = rest.extra ?? field?.description;

  return (
    <Form.Item
      {...rest}
      // 关键：减少底部间距，便于与行内 Icon 按钮垂直对齐
      style={{ marginBottom: 0, ...(rest as any).style }}
      label={label}
      required={required}
      validateStatus={validateStatus}
      help={help}
      extra={extra}
    >
      {children}
    </Form.Item>
  );
};

export default FormItemLite;
