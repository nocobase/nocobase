/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Radio, Space, Tooltip } from 'antd';
import React from 'react';
import { useWorkflowTranslation } from '../locale';

export type SyncModeSelectProps = {
  value?: boolean;
  onChange?: (value: boolean) => void;
  disabled?: boolean;
};

export function SyncModeSelect({ value, onChange, disabled }: SyncModeSelectProps) {
  const { t } = useWorkflowTranslation();
  const options = [
    {
      value: false,
      label: t('Asynchronously'),
      tooltip: t('Will be executed in the background as a queued task.'),
    },
    {
      value: true,
      label: t('Synchronously'),
      tooltip: t(
        'For user actions that require immediate feedback. Can not use asynchronous nodes in such mode, and it is not recommended to perform time-consuming operations under synchronous mode.',
      ),
    },
  ];
  return (
    <Radio.Group value={value} disabled={disabled} onChange={(e) => onChange?.(e.target.value)}>
      {options.map((option) => (
        <Radio key={String(option.value)} value={option.value}>
          <Space size="small">
            {option.label}
            <Tooltip title={option.tooltip}>
              <QuestionCircleOutlined />
            </Tooltip>
          </Space>
        </Radio>
      ))}
    </Radio.Group>
  );
}

export default SyncModeSelect;
