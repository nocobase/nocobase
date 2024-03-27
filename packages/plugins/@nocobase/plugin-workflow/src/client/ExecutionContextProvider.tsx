import React from 'react';

import { SchemaComponentOptions, usePlugin } from '@nocobase/client';

import PluginWorkflowClient, { FlowContext } from '.';

export function ExecutionContextProvider({ children, workflow, execution, nodes }) {
  const workflowPlugin = usePlugin(PluginWorkflowClient);
  const triggerComponents = workflowPlugin.triggers.get(workflow.type).components;
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
