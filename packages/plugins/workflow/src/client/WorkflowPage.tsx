import { cx } from '@emotion/css';
import React from 'react';
import { useRouteMatch } from 'react-router-dom';
import { SchemaComponent } from '@nocobase/client';
import { workflowPageClass } from './style';
import { WorkflowCanvas } from './WorkflowCanvas';



export const WorkflowPage = () => {
  const { params } = useRouteMatch<any>();

  return (
    <div className={cx(workflowPageClass)}>
      <SchemaComponent
        schema={{
          type: 'void',
          properties: {
            [`provider_${params.id}`]: {
              type: 'void',
              'x-decorator': 'ResourceActionProvider',
              'x-decorator-props': {
                collection: {
                  name: 'workflows',
                  fields: [],
                },
                resourceName: 'workflows',
                request: {
                  resource: 'workflows',
                  action: 'get',
                  params: {
                    filter: params,
                    appends: ['nodes', 'revisions.id', 'revisions.createdAt', 'revisions.current', 'revisions.executed'],
                  },
                },
              },
              'x-component': 'WorkflowCanvas'
            },
          },
        }}
        components={{
          WorkflowCanvas,
        }}
      />
    </div>
  );
};
