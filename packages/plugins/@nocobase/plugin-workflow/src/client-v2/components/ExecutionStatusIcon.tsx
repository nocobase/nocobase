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
  ClockCircleOutlined,
  CloseOutlined,
  ExclamationOutlined,
  HourglassOutlined,
  LoadingOutlined,
  MinusOutlined,
  RedoOutlined,
} from '@ant-design/icons';
import { Tag, theme, Tooltip } from 'antd';
import React from 'react';
import { EXECUTION_STATUS, EXECUTION_STATUS_OPTIONS_MAP } from '../../common/executionStatus';
import { useT } from '../locale';

// The framework-neutral `EXECUTION_STATUS_OPTIONS` only carries plain data, so the React icon nodes (a v1-client
// concern) live here in the v2 client lane.
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

/**
 * Compact, circular status indicator (icon-only Tag) used where a full status
 * label would be too wide — e.g. the execution-switcher dropdown rows. Mirrors
 * v1's `StatusButton`.
 */
export function ExecutionStatusIcon({ value }: { value: number | null }) {
  const compile = useT();
  const { token } = theme.useToken();
  const option = EXECUTION_STATUS_OPTIONS_MAP[value as number];
  if (!option) {
    return null;
  }
  const icon = STATUS_ICON[value as number] ?? <ClockCircleOutlined />;
  const size = token.controlHeightSM;
  return (
    <Tooltip title={compile(option.label)}>
      <Tag
        color={option.color}
        style={{
          marginInlineEnd: token.marginXS,
          borderRadius: '50%',
          padding: 0,
          width: size,
          height: size,
          lineHeight: `${size}px`,
          textAlign: 'center',
        }}
      >
        {icon}
      </Tag>
    </Tooltip>
  );
}

export default ExecutionStatusIcon;
