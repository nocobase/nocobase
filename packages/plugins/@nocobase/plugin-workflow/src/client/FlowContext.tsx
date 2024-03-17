import { SchemaComponentOptions, usePlugin } from '@nocobase/client';
import React, { useContext } from 'react';

import PluginWorkflowClient from '.';

export const FlowContext = React.createContext<any>({});

export function useFlowContext() {
  return useContext(FlowContext);
}

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
