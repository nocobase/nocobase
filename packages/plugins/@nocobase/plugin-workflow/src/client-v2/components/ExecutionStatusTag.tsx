/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  CheckOutlined,
  CloseOutlined,
  ExclamationOutlined,
  HourglassOutlined,
  LoadingOutlined,
  MinusOutlined,
  RedoOutlined,
} from '@ant-design/icons';
import { Tag } from 'antd';
import React from 'react';
import { EXECUTION_STATUS, EXECUTION_STATUS_OPTIONS_MAP } from '../../common/executionStatus';
import { useT } from '../locale';

const STATUS_ICON: Record<string, React.ReactNode> = {
  [EXECUTION_STATUS.QUEUEING as number]: <HourglassOutlined />,
  [EXECUTION_STATUS.STARTED]: <LoadingOutlined />,
  [EXECUTION_STATUS.RESOLVED]: <CheckOutlined />,
  [EXECUTION_STATUS.FAILED]: <ExclamationOutlined />,
  [EXECUTION_STATUS.ERROR]: <CloseOutlined />,
  [EXECUTION_STATUS.ABORTED]: <MinusOutlined rotate={90} />,
  [EXECUTION_STATUS.CANCELED]: <MinusOutlined rotate={45} />,
  [EXECUTION_STATUS.REJECTED]: <MinusOutlined />,
  [EXECUTION_STATUS.RETRY_NEEDED]: <RedoOutlined />,
};

export function ExecutionStatusTag({ value }: { value: number | null }) {
  const compile = useT();
  const option = EXECUTION_STATUS_OPTIONS_MAP[value as number];
  if (!option) {
    return null;
  }
  const icon = STATUS_ICON[value as number];
  return (
    <Tag color={option.color} icon={icon}>
      {compile(option.label)}
    </Tag>
  );
}

export default ExecutionStatusTag;
