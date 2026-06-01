/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Tag } from 'antd';
import React from 'react';
import { EXECUTION_STATUS_OPTIONS_MAP } from '../../common/executionStatus';
import { useT } from '../locale';

export function ExecutionStatusTag({ value }: { value: number | null }) {
  const compile = useT();
  const option = EXECUTION_STATUS_OPTIONS_MAP[value as number];
  if (!option) {
    return null;
  }
  return <Tag color={option.color}>{compile(option.label)}</Tag>;
}

export default ExecutionStatusTag;
