import {
  CollectionManagerContext,
  PluginManagerContext,
  SchemaComponent,
  SchemaComponentOptions,
  SettingsCenterProvider,
  useCollectionDataSource,
} from '@nocobase/client';
import { Card } from 'antd';
import React, { useContext } from 'react';
import { DynamicExpression } from './components/DynamicExpression';
import OpenDrawer from './components/OpenDrawer';
import { ExecutionLink } from './ExecutionLink';
import { ExecutionResourceProvider } from './ExecutionResourceProvider';
import expressionField from './interfaces/expression';
import { lang } from './locale';
import { instructions } from './nodes';
import { WorkflowTodo } from './nodes/manual/WorkflowTodo';
import { WorkflowTodoBlockInitializer } from './nodes/manual/WorkflowTodoBlockInitializer';
import { workflowSchema } from './schemas/workflows';
import { triggers } from './triggers';
import { WorkflowLink } from './WorkflowLink';

// registerField(expressionField.group, 'expression', expressionField);

export const WorkflowContext = React.createContext({});

export function useWorkflowContext() {
  return useContext(WorkflowContext);
}

function WorkflowPane() {
  return (
    <Card bordered={false}>
      <SchemaComponent
        schema={workflowSchema}
        components={{
          WorkflowLink,
          ExecutionResourceProvider,
          ExecutionLink,
          OpenDrawer,
        }}
      />
    </Card>
  );
}

export const WorkflowProvider = (props) => {
  const pmCtx = useContext(PluginManagerContext);
  const cmCtx = useContext(CollectionManagerContext);
  return (
    <SettingsCenterProvider
      settings={{
        workflow: {
          icon: 'PartitionOutlined',
          // title: `{{t("Workflow", { ns: "${NAMESPACE}" })}}`,
          title: lang('Workflow'),
          tabs: {
            workflows: {
              isBookmark: true,
              title: lang('Workflow'),
              component: WorkflowPane,
            },
          },
        },
      }}
    >
      <PluginManagerContext.Provider
        value={{
          components: {
            ...pmCtx?.components,
          },
        }}
      >
        <SchemaComponentOptions
          components={{
            WorkflowTodo,
            WorkflowTodoBlockInitializer,
            DynamicExpression,
          }}
          scope={{
            useCollectionDataSource,
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
        </SchemaComponentOptions>
      </PluginManagerContext.Provider>
    </SettingsCenterProvider>
  );
};
