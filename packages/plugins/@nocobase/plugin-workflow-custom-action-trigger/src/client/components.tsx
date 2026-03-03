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
import { TriggerCollectionRecordSelect, WorkflowVariableJSON } from '@nocobase/plugin-workflow/client';

import { useGlobalTriggerWorkflowCustomActionProps } from './hooks';
import { useCurrentWorkflowContext } from '@nocobase/plugin-workflow/client';
import { CONTEXT_TYPE } from '../common/constants';

export function TriggerScopeProvider(props) {
  const workflow = useCurrentWorkflowContext();
  return props.types.includes(workflow.config.type) ||
    (props.types.includes(CONTEXT_TYPE.GLOBAL) && !workflow.config.type)
    ? props.children
    : null;
}

export function TriggerDataInput(props) {
  const workflow = useCurrentWorkflowContext();
  if (workflow.config.type) {
    return <TriggerCollectionRecordSelect {...props} />;
  }
  return <WorkflowVariableJSON changeOnSelect autoSize={{ minRows: 6 }} {...props} />;
}

export function GlobalTriggerWorkflowAction(props) {
  const { onClick } = useGlobalTriggerWorkflowCustomActionProps();
  return <Action {...props} onClick={onClick} />;
}
