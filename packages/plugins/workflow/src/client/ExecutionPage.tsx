import { cx } from '@emotion/css';
import { SchemaComponent } from '@nocobase/client';
import React from 'react';
import { useParams } from 'react-router-dom';
import { ExecutionCanvas } from './ExecutionCanvas';
import { workflowPageClass } from './style';

export const ExecutionPage = () => {
  const params = useParams<any>();

  return (
    <div className={cx(workflowPageClass)}>
      <SchemaComponent
        schema={{
          type: 'void',
          properties: {
            [`execution_${params.id}`]: {
              type: 'void',
              'x-decorator': 'ResourceActionProvider',
              'x-decorator-props': {
                collection: {
                  name: 'executions',
                  fields: [],
                },
                resourceName: 'executions',
                request: {
                  resource: 'executions',
                  action: 'get',
                  params: {
                    filter: params,
                    appends: ['jobs', 'workflow', 'workflow.nodes'],
                  },
                },
              },
              'x-component': 'ExecutionCanvas',
            },
          },
        }}
        components={{
          ExecutionCanvas,
        }}
      />
    </div>
  );
};
