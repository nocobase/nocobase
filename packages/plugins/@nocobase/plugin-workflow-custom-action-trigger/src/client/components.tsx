/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Action } from '@nocobase/client';

import { useGlobalTriggerWorkflowCustomActionProps } from './hooks';
import { useCurrentWorkflowContext } from '@nocobase/plugin-workflow/client';

export function TriggerScopeProvider(props) {
  const workflow = useCurrentWorkflowContext();
  return props.types.includes(workflow.config.type) ? props.children : null;
}

export function GlobalTriggerWorkflowAction(props) {
  const { onClick } = useGlobalTriggerWorkflowCustomActionProps();
  return <Action {...props} onClick={onClick} />;
}
