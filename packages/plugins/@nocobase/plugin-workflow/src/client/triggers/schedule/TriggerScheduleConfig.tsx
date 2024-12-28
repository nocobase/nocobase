/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';

import { SchemaComponent, usePlugin } from '@nocobase/client';
import WorkflowPlugin from '../..';
import { useCurrentWorkflowContext } from '../../FlowContext';
import { ScheduleModes } from './ScheduleModes';

export function TriggerScheduleConfig() {
  const workflow = useCurrentWorkflowContext();
  const workflowPlugin = usePlugin(WorkflowPlugin);
  const trigger = workflowPlugin.triggers.get(workflow.type);

  return (
    <SchemaComponent
      components={trigger.components}
      schema={{
        type: 'void',
        properties: ScheduleModes[workflow.config.mode].triggerFieldset,
      }}
    />
  );
}
