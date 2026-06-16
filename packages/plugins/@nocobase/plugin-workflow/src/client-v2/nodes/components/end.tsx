/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Form, Radio } from 'antd';
import { JOB_STATUS } from '../../components/jobStatus';
import { useT } from '../../locale';

const END_STATUS_OPTIONS = [
  { value: JOB_STATUS.RESOLVED, label: 'Succeeded' },
  { value: JOB_STATUS.FAILED, label: 'Failed' },
] as const;

export function EndFieldset() {
  const t = useT();

  return (
    <Form.Item
      name={['config', 'endStatus']}
      label={t('End status')}
      rules={[{ required: true }]}
      initialValue={JOB_STATUS.RESOLVED}
    >
      <Radio.Group options={END_STATUS_OPTIONS.map((option) => ({ ...option, label: t(option.label) }))} />
    </Form.Item>
  );
}
