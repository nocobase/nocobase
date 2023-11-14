import {
  CollectionManagerContext,
  PluginManagerContext,
  SchemaComponent,
  SchemaComponentContext,
} from '@nocobase/client';
import { Card } from 'antd';
import React, { useContext } from 'react';
import { ExecutionLink } from './ExecutionLink';
import { ExecutionResourceProvider } from './ExecutionResourceProvider';
import { WorkflowLink } from './WorkflowLink';
import OpenDrawer from './components/OpenDrawer';
import expressionField from './interfaces/expression';
import { instructions } from './nodes';
import { workflowSchema } from './schemas/workflows';
import { getTriggersOptions, triggers } from './triggers';
import { ExecutionStatusSelect } from './components/ExecutionStatusSelect';

// registerField(expressionField.group, 'expression', expressionField);

export const WorkflowContext = React.createContext({});

export function useWorkflowContext() {
  return useContext(WorkflowContext);
}

export function WorkflowPane() {
  const ctx = useContext(SchemaComponentContext);
  return (
    <Card bordered={false}>
      <SchemaComponentContext.Provider value={{ ...ctx, designable: false }}>
        <SchemaComponent
          schema={workflowSchema}
          components={{
            WorkflowLink,
            ExecutionResourceProvider,
            ExecutionLink,
            OpenDrawer,
            ExecutionStatusSelect,
          }}
          scope={{
            getTriggersOptions,
          }}
        />
      </SchemaComponentContext.Provider>
    </Card>
  );
}

export const WorkflowProvider = (props) => {
  const pmCtx = useContext(PluginManagerContext);
  const cmCtx = useContext(CollectionManagerContext);
  return (
    <PluginManagerContext.Provider
      value={{
        components: {
          ...pmCtx?.components,
        },
      }}
    >
      <CollectionManagerContext.Provider
        value={{
          ...cmCtx,
          interfaces: {
            ...cmCtx.interfaces,
            expression: expressionField,
          },
        }}
      >
        <WorkflowContext.Provider value={{ triggers, instructions }}>{props.children}</WorkflowContext.Provider>
      </CollectionManagerContext.Provider>
    </PluginManagerContext.Provider>
  );
};
