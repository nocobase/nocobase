/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Form, Input } from 'antd';
import React from 'react';
import { useT } from '../locale';

export function NameField() {
  const t = useT();
  return (
    <Form.Item
      name="name"
      label={`${t('Storage name')} :`}
      rules={[{ required: true, message: t('The field value is required') }]}
      extra={t(
        'Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.',
      )}
    >
      <Input />
    </Form.Item>
  );
}
