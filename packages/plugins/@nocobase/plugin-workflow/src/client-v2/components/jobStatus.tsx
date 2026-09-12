/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import {
  CheckOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  ExclamationOutlined,
  MinusOutlined,
  RedoOutlined,
} from '@ant-design/icons';
import { Tag } from 'antd';
import { useT } from '../locale';

export const JOB_STATUS = {
  PENDING: 0,
  RESOLVED: 1,
  FAILED: -1,
  ERROR: -2,
  ABORTED: -3,
  CANCELED: -4,
  REJECTED: -5,
  RETRY_NEEDED: -6,
} as const;

export const JOB_STATUS_OPTIONS_MAP: Record<number, { label: string; color: string; icon: React.ReactNode }> = {
  [JOB_STATUS.PENDING]: { label: 'Pending', color: 'gold', icon: <ClockCircleOutlined /> },
  [JOB_STATUS.RESOLVED]: { label: 'Resolved', color: 'green', icon: <CheckOutlined /> },
  [JOB_STATUS.FAILED]: { label: 'Failed', color: 'red', icon: <ExclamationOutlined /> },
  [JOB_STATUS.ERROR]: { label: 'Error', color: 'red', icon: <CloseOutlined /> },
  [JOB_STATUS.ABORTED]: { label: 'Aborted', color: 'red', icon: <MinusOutlined rotate={90} /> },
  [JOB_STATUS.CANCELED]: { label: 'Canceled', color: 'volcano', icon: <MinusOutlined rotate={45} /> },
  [JOB_STATUS.REJECTED]: { label: 'Rejected', color: 'volcano', icon: <MinusOutlined /> },
  [JOB_STATUS.RETRY_NEEDED]: { label: 'Retry needed', color: 'volcano', icon: <RedoOutlined /> },
};

export function JobStatusTag({ value }: { value: number | null }) {
  const t = useT();
  const option = JOB_STATUS_OPTIONS_MAP[value as number];
  if (!option) {
    return null;
  }
  return <Tag color={option.color}>{t(option.label)}</Tag>;
}
