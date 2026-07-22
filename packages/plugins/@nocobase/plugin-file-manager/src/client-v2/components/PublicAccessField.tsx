/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Checkbox, Form } from 'antd';
import React from 'react';
import { useT } from '../locale';

export function PublicAccessField() {
  const t = useT();
  const form = Form.useFormInstance();
  const useOriginalUrl = Form.useWatch(['options', 'useOriginalUrl'], form);
  if (useOriginalUrl) {
    return null;
  }
  return (
    <Form.Item
      name={['options', 'public']}
      valuePropName="checked"
      extra={t(
        'When checked, anyone who obtains a file URL can access the file without NocoBase permission checks. Make sure the underlying storage also permits access to the file.',
      )}
    >
      <Checkbox>{t('Public access')}</Checkbox>
    </Form.Item>
  );
}
