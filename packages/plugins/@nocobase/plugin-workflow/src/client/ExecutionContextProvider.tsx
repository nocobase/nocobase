/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Result } from 'antd';

import { SchemaComponentOptions, usePlugin } from '@nocobase/client';

import PluginWorkflowClient, { FlowContext } from '.';
import { lang } from './locale';

export function ExecutionContextProvider({ children, workflow, execution, nodes }) {
  const workflowPlugin = usePlugin(PluginWorkflowClient);

  if (!workflow?.type) {
    return <Result status="warning" title={lang('Workflow is not exists')} />;
  }

  const trigger = workflowPlugin.triggers.get(workflow.type);

  const triggerComponents = trigger.components;
  const nodeComponents = nodes.reduce(
    (components, { type }) => Object.assign(components, workflowPlugin.instructions.get(type).components),
    {},
  );

  return (
    <FlowContext.Provider
      value={{
        workflow,
        nodes,
        execution,
      }}
    >
      <SchemaComponentOptions
        components={{
          ...triggerComponents,
          ...nodeComponents,
        }}
      >
        {children}
      </SchemaComponentOptions>
    </FlowContext.Provider>
  );
}
