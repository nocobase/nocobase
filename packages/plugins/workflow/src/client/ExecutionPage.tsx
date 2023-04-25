import React from 'react';
import { cx } from '@emotion/css';
import { useRouteMatch } from 'react-router-dom';
import { SchemaComponent } from '@nocobase/client';
import { workflowPageClass } from './style';
import { ExecutionCanvas } from './ExecutionCanvas';

export const ExecutionPage = () => {
  const { params } = useRouteMatch<any>();

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
