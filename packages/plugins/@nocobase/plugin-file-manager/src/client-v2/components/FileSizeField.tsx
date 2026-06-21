/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FileSizeInput } from '@nocobase/client-v2';
import { Form } from 'antd';
import React from 'react';
import { FILE_SIZE_LIMIT_DEFAULT, FILE_SIZE_LIMIT_MAX, FILE_SIZE_LIMIT_MIN } from '../../constants';
import { useT } from '../locale';

export function FileSizeField() {
  const t = useT();
  return (
    <Form.Item
      name={['rules', 'size']}
      label={`${t('File size limit')} :`}
      rules={[{ required: true, message: t('The field value is required') }]}
      extra={t('Minimum from 1 byte.')}
    >
      <FileSizeInput min={FILE_SIZE_LIMIT_MIN} max={FILE_SIZE_LIMIT_MAX} defaultValue={FILE_SIZE_LIMIT_DEFAULT} />
    </Form.Item>
  );
}
