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

export function ParanoidField() {
  const t = useT();
  return (
    <Form.Item
      name="paranoid"
      valuePropName="checked"
      extra={t(
        'Files are only removed when their corresponding records in the file collection are deleted. If a record from another collection includes an associating field referencing the file collection, the file will not be deleted unless cascade deletion is enabled for that association.',
      )}
    >
      <Checkbox>{t('Keep file in storage when destroy the file record')}</Checkbox>
    </Form.Item>
  );
}
