import React from 'react';
import { SchemaComponent } from '../schema-component';
import { WorkflowLink, WorkflowPage, ExecutionResourceProvider } from '.';
import { workflowSchema } from './schemas/workflows';

export const WorkflowTable = () => {
  return (
    <SchemaComponent
      schema={workflowSchema}
      components={{
        WorkflowLink,
        WorkflowPage,
        ExecutionResourceProvider
      }}
    />
  );
};
