/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Checkbox, Form } from 'antd';
import React, { useEffect } from 'react';
import { useT } from '../locale';

export function UseOriginalUrlField() {
  const t = useT();
  const form = Form.useFormInstance();
  const useOriginalUrl = Form.useWatch(['options', 'useOriginalUrl'], form);
  useEffect(() => {
    if (useOriginalUrl) {
      form.setFieldValue(['options', 'public'], false);
    }
  }, [form, useOriginalUrl]);
  return (
    <Form.Item
      name={['options', 'useOriginalUrl']}
      valuePropName="checked"
      extra={t(
        "When checked, file records return the storage engine's original URL instead of the stable NocoBase URL. Original URLs do not pass through NocoBase permission checks and may change when the storage configuration changes.",
      )}
    >
      <Checkbox>{t('Use original URL')}</Checkbox>
    </Form.Item>
  );
}
