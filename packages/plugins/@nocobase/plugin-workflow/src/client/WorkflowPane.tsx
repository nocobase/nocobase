import { SchemaComponent, SchemaComponentContext } from '@nocobase/client';
import { Card } from 'antd';
import React, { useContext } from 'react';
import { ExecutionLink } from './ExecutionLink';
import { ExecutionResourceProvider } from './ExecutionResourceProvider';
import { WorkflowLink } from './WorkflowLink';
import OpenDrawer from './components/OpenDrawer';
import { workflowSchema } from './schemas/workflows';
import { getTriggersOptions } from './triggers';
import { ExecutionStatusSelect } from './components/ExecutionStatusSelect';

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
