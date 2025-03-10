/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Tooltip } from 'antd';

import { lang } from '../locale';

export function WorkflowTitle(workflow) {
  return workflow.enabled ? (
    workflow.title
  ) : (
    <Tooltip title={lang('New version enabled')}>
      <span style={{ textDecoration: 'line-through' }}>{workflow.title}</span>
    </Tooltip>
  );
}
