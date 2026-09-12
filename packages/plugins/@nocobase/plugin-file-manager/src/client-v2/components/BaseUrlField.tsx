/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EnvVariableInput } from '@nocobase/client-v2';
import { Form } from 'antd';
import React from 'react';
import { useT } from '../locale';

export function BaseUrlField() {
  const t = useT();
  return (
    <Form.Item
      name="baseUrl"
      label={`${t('Base URL')} :`}
      rules={[{ required: true, message: t('The field value is required') }]}
      extra={t('Base URL for file access, could be your CDN base URL. For example: "https://cdn.nocobase.com".')}
    >
      <EnvVariableInput />
    </Form.Item>
  );
}
