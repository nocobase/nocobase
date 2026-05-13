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

export function MimetypeField() {
  const t = useT();
  return (
    <Form.Item
      name={['rules', 'mimetype']}
      label={`${t('File type allowed (in MIME type format)')} :`}
      extra={t(
        'Multi-types seperated with comma, for example: "image/*", "image/png", "image/*, application/pdf" etc.',
      )}
    >
      <Input placeholder="*" />
    </Form.Item>
  );
}
