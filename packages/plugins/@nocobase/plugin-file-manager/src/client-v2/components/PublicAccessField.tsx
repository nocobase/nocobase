/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Checkbox, Form, Space, theme, Tooltip } from 'antd';
import React from 'react';
import { useT } from '../locale';

type Translate = (key: string) => string;

export interface PublicAccessCheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  t: Translate;
}

const PUBLIC_ACCESS_DESCRIPTION =
  'When checked, anyone with the file URL can access the file without NocoBase permission checks.';

export function PublicAccessCheckbox({ checked, onChange, disabled, t }: PublicAccessCheckboxProps) {
  const { token } = theme.useToken();
  const description = t(PUBLIC_ACCESS_DESCRIPTION);

  return (
    <Space size={4}>
      <Checkbox checked={checked} onChange={(event) => onChange?.(event.target.checked)} disabled={disabled}>
        {t('Allow public access')}
      </Checkbox>
      <Tooltip title={description}>
        <QuestionCircleOutlined
          tabIndex={0}
          role="img"
          aria-label={description}
          style={{ color: token.colorTextSecondary, cursor: 'help', fontSize: token.fontSize }}
        />
      </Tooltip>
    </Space>
  );
}

export function PublicAccessField() {
  const t = useT();

  return (
    <Form.Item name={['options', 'public']} valuePropName="checked" noStyle>
      <PublicAccessCheckbox t={t} />
    </Form.Item>
  );
}
