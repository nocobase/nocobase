/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Form, Radio, Select, Space } from 'antd';
import { useFlowEngine } from '@nocobase/flow-engine';
import { WorkflowTypedVariableInput } from '@nocobase/plugin-workflow/client-v2';
import { useT } from '../locale';

const JOB_STATUS = {
  RESOLVED: 1,
  FAILED: -1,
} as const;

const DURATION_UNIT_OPTIONS = [
  { value: 1_000, key: 'Seconds' },
  { value: 60_000, key: 'Minutes' },
  { value: 3_600_000, key: 'Hours' },
  { value: 86_400_000, key: 'Days' },
  { value: 604_800_000, key: 'Weeks' },
] as const;

export function DelayFieldset() {
  const t = useT();
  const flowEngine = useFlowEngine();
  const workflowT = (key: string) => flowEngine.context.t(key, { ns: ['workflow', 'client'], nsMode: 'fallback' });

  return (
    <>
      <Form.Item label={t('Duration')} required>
        <Space.Compact>
          <Form.Item name={['config', 'unit']} noStyle initialValue={60_000} rules={[{ required: true }]}>
            <Select
              allowClear={false}
              placeholder={t('Unit')}
              options={DURATION_UNIT_OPTIONS.map((option) => ({
                value: option.value,
                label: workflowT(option.key),
              }))}
            />
          </Form.Item>
          <Form.Item name={['config', 'duration']} noStyle initialValue={1} rules={[{ required: true }]}>
            <WorkflowTypedVariableInput
              types={[['number', { min: 1 }]]}
              nullable={false}
              defaultToFirstConstantTypeWhenUndefined
              placeholder={t('Duration')}
            />
          </Form.Item>
        </Space.Compact>
      </Form.Item>

      <Form.Item
        name={['config', 'endStatus']}
        label={t('End status')}
        rules={[{ required: true }]}
        initialValue={JOB_STATUS.RESOLVED}
      >
        <Radio.Group
          options={[
            { label: t('Succeed and continue'), value: JOB_STATUS.RESOLVED },
            { label: t('Fail and exit'), value: JOB_STATUS.FAILED },
          ]}
        />
      </Form.Item>
    </>
  );
}

export default DelayFieldset;
