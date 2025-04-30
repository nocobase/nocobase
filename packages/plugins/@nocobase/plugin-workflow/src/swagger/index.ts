/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  openapi: '3.0.2',
  info: {
    title: 'NocoBase API - Workflow plugin',
  },
  tags: [],
  paths: {
    '/workflows:list': {
      get: {
        tags: ['workflows'],
        description: '',
        parameters: [
          {
            $ref: '#/components/schemas/workflow/filter',
          },
        ],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/workflow/model',
                  },
                },
              },
            },
          },
        },
      },
    },
    '/workflows:get': {
      get: {
        tags: ['workflows'],
        description: 'Get single workflow',
        parameters: [
          {
            $ref: '#/components/schemas/workflow/filterByTk',
          },
          {
            $ref: '#/components/schemas/workflow/filter',
          },
        ],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    {
                      $ref: '#/components/schemas/workflow/model',
                    },
                    {
                      type: 'object',
                      properties: {
                        nodes: {
                          type: 'array',
                          items: {
                            $ref: '#/components/schemas/node',
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    '/workflows:create': {
      post: {
        tags: ['workflows'],
        description: 'Create new workflow',
        parameters: [],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: {
                    $ref: '#/components/schemas/workflow/model/properties/title',
                  },
                  type: {
                    $ref: '#/components/schemas/workflow/model/properties/type',
                  },
                  description: {
                    $ref: '#/components/schemas/workflow/model/properties/description',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    {
                      $ref: '#/components/schemas/workflow',
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    '/workflows:update': {
      post: {
        tags: ['workflows'],
        description: 'Update a workflow',
        parameters: [],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: {
                    $ref: '#/components/schemas/workflow/model/properties/title',
                  },
                  enabled: {
                    $ref: '#/components/schemas/workflow/model/properties/enabled',
                  },
                  description: {
                    $ref: '#/components/schemas/workflow/model/properties/description',
                  },
                  config: {
                    $ref: '#/components/schemas/workflow/model/properties/config',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'OK',
          },
        },
      },
    },
    '/workflows:destroy': {
      post: {
        tags: ['workflows'],
        description: 'Delete workflows. Also will delete all nodes and executions of the workflow.',
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            description: 'Primary key of a record',
            schema: {
              type: 'integer',
              description: 'ID. The only workflow with ID will be deleted.',
            },
          },
          {
            name: 'filter',
            in: 'query',
            description: 'Filter',
            schema: {
              type: 'object',
              properties: {
                key: {
                  type: 'string',
                  description: 'Key. If provided, all workflow with same key will be deleted.',
                },
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'OK',
          },
        },
      },
    },
    '/workflows:revision': {
      post: {
        tags: ['workflows'],
        description: 'Duplicate a workflow to a new version or a new workflow. All nodes will be duplicated too.',
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            description: 'Primary key of a record',
            schema: {
              type: 'integer',
              description: 'ID. The workflow to duplicate.',
            },
          },
          {
            name: 'filter',
            in: 'query',
            description: 'Filter',
            schema: {
              type: 'object',
              properties: {
                key: {
                  type: 'string',
                  description:
                    'Key. If provided, only duplicate to a new version. Or will be duplicated to a new workflow.',
                },
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'OK',
          },
        },
      },
    },
    '/workflows:trigger': {
      post: {
        tags: ['workflows'],
        description: '',
        parameters: [
          {
            name: 'triggerWorkflows',
            in: 'query',
            description:
              'A combined string to describe workflows to trigger and context data to use. e.g. `?triggerWorkflows=1,2!category`. Each comma separated part is a trigger pair,  as `1` and `2!category`. The number part is the ID of workflow, exclamation means the path of association to use in form data. If ignored, will trigger with the full form data object.',
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          202: {
            description: 'Accepted',
          },
          400: {
            description: 'Bad Request',
          },
        },
      },
    },
    '/workflows/{workflowId}/nodes:create': {
      post: {
        tags: ['workflows.nodes'],
        description: 'Create a new node in workflow',
        parameters: [],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: {
                    $ref: '#/components/schemas/node/properties/title',
                  },
                  type: {
                    $ref: '#/components/schemas/node/properties/type',
                  },
                  upstreamId: {
                    $ref: '#/components/schemas/node/properties/upstreamId',
                  },
                  branchIndex: {
                    $ref: '#/components/schemas/node/properties/branchIndex',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    {
                      $ref: '#/components/schemas/node',
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    '/flow_nodes:update': {
      post: {
        tags: ['flow_nodes'],
        description: 'Update node properties.',
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            description: 'Primary key of a record',
            schema: {
              type: 'integer',
              description: 'ID',
            },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: {
                    $ref: '#/components/schemas/node/properties/title',
                  },
                  config: {
                    $ref: '#/components/schemas/node/properties/config',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'OK',
          },
          400: {
            description: 'Bad Request. Node in exected workflow cannot be updated.',
          },
        },
      },
    },
    '/flow_nodes:destroy': {
      post: {
        tags: ['flow_nodes'],
        description: 'Delete a node. All nodes in sub-branches will also be deleted.',
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            description: 'Primary key of a record',
            schema: {
              type: 'integer',
              description: 'ID',
            },
          },
        ],
        responses: {
          200: {
            description: 'OK',
          },
          400: {
            description: 'Bad Request. Node in exected workflow cannot be deleted.',
          },
        },
      },
    },
    '/executions:list': {
      get: {
        tags: ['executions'],
        description: 'Get list of executions',
        parameters: [],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  description: 'List of executions',
                  items: {
                    $ref: '#/components/schemas/execution',
                    type: 'object',
                    not: {
                      $ref: '#/components/schemas/execution/properties/jobs',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/executions:get': {
      get: {
        tags: ['executions'],
        description: 'Get single execution',
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            description: 'Primary key of a record',
            schema: {
              type: 'integer',
              description: 'ID',
            },
          },
        ],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/execution',
                },
              },
            },
          },
        },
      },
    },
    '/workflowManualTasks:list': {
      get: {
        tags: ['workflowManualTasks'],
        description: 'List manual jobs',
        parameters: [],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  description: 'List of manual jobs',
                  items: {
                    $ref: '#/components/schemas/user_job',
                  },
                },
              },
            },
          },
        },
      },
    },
    '/workflowManualTasks:get': {
      get: {
        tags: ['workflowManualTasks'],
        description: 'Single user job',
        parameters: [],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    {
                      $ref: '#/components/schemas/user_job',
                    },
                    {
                      type: 'object',
                      properties: {
                        execution: {
                          $ref: '#/components/schemas/execution',
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    '/workflowManualTasks:submit': {
      post: {
        tags: ['workflowManualTasks'],
        description: '',
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            description: 'Primary key of a record',
            schema: {
              type: 'integer',
              description: 'ID',
            },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  result: {
                    type: 'object',
                    properties: {
                      $formKey: {
                        type: 'object',
                      },
                      _: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          202: {
            description: 'Accepted',
          },
          400: {
            description: 'Bad Request. Status of the job is not 0.',
          },
        },
      },
    },
  },
  components: {
    schemas: {
      workflow: {
        model: {
          type: 'object',
          description: 'Workflow',
          properties: {
            id: {
              type: 'integer',
              description: 'ID',
            },
            key: {
              type: 'string',
              description: 'Key. Variant versions of the same workflow share the same key.',
            },
            title: {
              type: 'string',
              description: 'Title',
            },
            description: {
              type: 'string',
              description: 'Description',
            },
            current: {
              type: 'boolean',
              description: 'Current version',
            },
            enabled: {
              type: 'boolean',
              description: 'Enabled',
            },
            type: {
              type: 'string',
              description: 'Event type',
            },
            config: {
              type: 'object',
              description: 'Configuration JSON object',
            },
            nodes: {
              type: 'array',
              description: 'Workflow nodes',
            },
            executions: {
              type: 'array',
              description: 'Executions',
            },
            revisions: {
              type: 'array',
              description: 'Revisions',
            },
          },
        },
        filterByTk: {
          name: 'filterByTk',
          in: 'query',
          description: 'Primary key of a record',
          schema: {
            type: 'integer',
            description: 'ID',
          },
        },
        filter: {
          name: 'filter',
          in: 'query',
          description: 'Filter parameters in JSON format',
          schema: {
            type: 'object',
            properties: {
              id: {
                $ref: '#/components/schemas/workflow/model/properties/id',
              },
              title: {
                $ref: '#/components/schemas/workflow/model/properties/title',
              },
              type: {
                $ref: '#/components/schemas/workflow/model/properties/type',
              },
              enabled: {
                $ref: '#/components/schemas/workflow/model/properties/enabled',
              },
              current: {
                $ref: '#/components/schemas/workflow/model/properties/current',
              },
              key: {
                $ref: '#/components/schemas/workflow/model/properties/key',
              },
            },
          },
        },
      },
      node: {
        type: 'object',
        description: 'Workflow node',
        properties: {
          id: {
            type: 'integer',
            description: 'ID',
          },
          title: {
            type: 'string',
            description: 'Title',
          },
          workflowId: {
            type: 'integer',
            description: 'Workflow ID',
          },
          upstreamId: {
            type: 'integer',
            description: 'Upstream node ID',
          },
          upstream: {
            type: 'object',
            description: 'Upstream node',
            $ref: '#/components/schemas/node',
          },
          downstreamId: {
            type: 'integer',
            description: 'Downstream node ID in flow, not in sub-branches',
            $ref: '#/components/schemas/node',
          },
          downstream: {
            type: 'object',
            description: 'Downstream node',
            $ref: '#/components/schemas/node',
          },
          type: {
            type: 'string',
            description: 'Node type',
          },
          config: {
            type: 'object',
            description: 'Configuration JSON object',
          },
          branchIndex: {
            type: 'integer',
            description: 'Non-null if the node is a branch node of upstream',
          },
          branches: {
            type: 'array',
            description: 'Branch nodes under the node',
            items: {
              $ref: '#/components/schemas/node',
            },
          },
        },
      },
      execution: {
        type: 'object',
        description: 'Execution record of workflow',
        properties: {
          id: {
            type: 'integer',
            description: 'ID',
          },
          key: {
            type: 'string',
            description: 'Workflow key',
          },
          workflowId: {
            type: 'integer',
            description: 'Workflow ID',
          },
          context: {
            type: 'object',
            description: 'Context data',
          },
          status: {
            type: 'integer',
            description: 'Status of execution',
          },
          jobs: {
            type: 'array',
            description: 'Results of executed nodes',
            items: {
              $ref: '#/components/schemas/job',
            },
          },
        },
      },
      job: {
        type: 'object',
        description: 'Job record of exected node',
        properties: {
          id: {
            type: 'integer',
            description: 'ID',
          },
          executionId: {
            type: 'integer',
            description: 'Execution ID',
          },
          nodeId: {
            type: 'integer',
            description: 'Node ID',
          },
          status: {
            type: 'integer',
            description: 'Status of job',
          },
          result: {
            type: 'object',
            description: 'Result data of job',
          },
        },
      },
      user_job: {
        type: 'object',
        description: 'User job',
        properties: {
          id: {
            type: 'integer',
            description: 'ID',
          },
          executionId: {
            type: 'integer',
            description: 'Execution ID',
          },
          nodeId: {
            type: 'integer',
            description: 'Node ID',
          },
          workflowId: {
            type: 'integer',
            description: 'Workflow ID',
          },
          userId: {
            type: 'integer',
            description: 'User ID',
          },
          status: {
            type: 'integer',
            description: 'Status of job',
          },
          result: {
            type: 'object',
            description: 'Result data of job',
          },
        },
      },
    },
  },
};
