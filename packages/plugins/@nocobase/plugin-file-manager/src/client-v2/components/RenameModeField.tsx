/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Form, Radio } from 'antd';
import React from 'react';
import { useT } from '../locale';

const RENAME_MODE_OPTIONS = [
  { label: 'Append random ID', value: 'appendRandomID' },
  { label: 'Random string', value: 'random' },
  { label: 'Keep original filename (will be overwrite if filename is existed)', value: 'none' },
];

export function RenameModeField() {
  const t = useT();
  return (
    <Form.Item
      name="renameMode"
      label={`${t('Renaming')} :`}
      extra={t('Renaming strategy to avoid filename conflicts when uploading files.')}
    >
      <Radio.Group options={RENAME_MODE_OPTIONS.map((item) => ({ ...item, label: t(item.label) }))} />
    </Form.Item>
  );
}
