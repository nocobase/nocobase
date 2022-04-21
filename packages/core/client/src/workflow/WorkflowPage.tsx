import { cx } from '@emotion/css';
import { ISchema } from '@formily/react';
import React from 'react';
import { useRouteMatch } from 'react-router-dom';
import { SchemaComponent } from '..';
import { workflowPageClass } from './style';
import { TriggerConfig } from './triggers';
import { WorkflowCanvas } from './WorkflowCanvas';

const workflowCollection = {
  name: 'workflow',
  fields: [
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: {
        title: '流程名称',
        type: 'string',
        'x-component': 'Input',
        required: true,
      } as ISchema,
    },
  ],
};

export const WorkflowPage = () => {
  const { params } = useRouteMatch<any>();

  return (
    <div className={cx(workflowPageClass)}>
      <div className="workflow-canvas">
        <SchemaComponent
          schema={{
            type: 'void',
            properties: {
              [`provider_${params.id}`]: {
                type: 'void',
                'x-decorator': 'ResourceActionProvider',
                'x-decorator-props': {
                  collection: workflowCollection,
                  resourceName: 'workflows',
                  request: {
                    resource: 'workflows',
                    action: 'get',
                    params: {
                      filter: params,
                      appends: ['nodes'],
                    },
                  },
                },
                properties: {
                  trigger: {
                    type: 'void',
                    'x-component': 'TriggerConfig',
                  },
                  nodes: {
                    type: 'void',
                    'x-decorator': 'CollectionProvider',
                    'x-decorator-props': {
                      collection: {
                        name: 'flow_nodes',
                        fields: [
                          {
                            type: 'string',
                            name: 'title',
                            interface: 'input',
                            uiSchema: {
                              title: '节点名称',
                              type: 'string',
                              'x-component': 'Input',
                            },
                          },
                          {
                            type: 'string',
                            name: 'type',
                            interface: 'select',
                            uiSchema: {
                              title: '节点类型',
                              type: 'string',
                              'x-component': 'Select',
                              required: true,
                            },
                          },
                        ],
                      },
                    },
                    'x-component': 'WorkflowCanvas',
                    'x-component-props': {
                      // nodes
                    },
                  },
                },
              },
            },
          }}
          components={{
            TriggerConfig,
            WorkflowCanvas,
          }}
        />
      </div>
    </div>
  );
};
