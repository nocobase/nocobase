/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * NocoBase Workflow Plugin — Swagger / OpenAPI 3.0 document
 *
 * Resources covered:
 *   workflows         — Workflow CRUD, versioning, sync and manual execution
 *   workflows.nodes   — Create nodes inside a workflow (association resource)
 *   flow_nodes        — Update / delete / move / duplicate / test nodes
 *   executions        — Execution record queries, cancellation and deletion
 *   jobs              — Node job queries and resuming paused executions
 *   userWorkflowTasks — Current-user's pending workflow tasks
 *
 * API conventions:
 *   Base URL  : /api
 *   Route fmt : /api/<resource>:<action>
 *   Assoc fmt : /api/<resource>/<sourceId>/<association>:<action>
 *
 * Client-side usage (example):
 *   import { useAPIClient } from '@nocobase/client';
 *   const api = useAPIClient();
 *   await api.resource('workflows').list({ filter: { current: true } });
 *
 * Direct HTTP usage (example):
 *   GET /api/workflows:list?filter={"current":true}&sort=-createdAt&except[]=config
 *   Headers: Authorization: Bearer <token>
 */

export default {
  openapi: '3.0.2',
  info: {
    title: 'NocoBase API - Workflow plugin',
  },
  tags: [
    { name: 'workflows', description: 'Workflow management: CRUD, versioning, sync, manual execution' },
    { name: 'workflows.nodes', description: 'Create nodes inside a workflow (association resource)' },
    { name: 'flow_nodes', description: 'Flow node management: update, delete, move, duplicate, test' },
    { name: 'executions', description: 'Execution record management: list, get, cancel, delete' },
    { name: 'jobs', description: 'Node job management: list, get, resume' },
    { name: 'userWorkflowTasks', description: 'Current-user workflow task queries' },
  ],
  paths: {
    // ─────────────────────────────────────────────────────────────────────────
    // workflows
    // ─────────────────────────────────────────────────────────────────────────

    '/workflows:list': {
      get: {
        tags: ['workflows'],
        summary: 'List workflows',
        description: [
          'Get paginated list of workflows.',
          '',
          'Tip: filter by `current: true` to retrieve only the active version of each workflow.',
          '',
          'Example:',
          '```',
          'GET /api/workflows:list?filter={"current":true}&sort=-createdAt&except[]=config',
          '```',
        ].join('\n'),
        parameters: [
          { $ref: '#/components/schemas/workflow/filter' },
          {
            name: 'sort',
            in: 'query',
            description: 'Sort fields. Prefix with `-` for descending. e.g. `-createdAt`',
            schema: { type: 'string' },
          },
          {
            name: 'fields',
            in: 'query',
            description: 'Return only specified fields',
            schema: { type: 'array', items: { type: 'string' } },
          },
          {
            name: 'except',
            in: 'query',
            description: 'Exclude specified fields from response (e.g. `config` to reduce payload)',
            schema: { type: 'array', items: { type: 'string' } },
          },
          {
            name: 'appends',
            in: 'query',
            description: 'Append association data (e.g. `stats`, `versionStats`)',
            schema: { type: 'array', items: { type: 'string' } },
          },
          {
            name: 'page',
            in: 'query',
            description: 'Page number (1-based)',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'pageSize',
            in: 'query',
            description: 'Number of items per page',
            schema: { type: 'integer', default: 20 },
          },
        ],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/workflow/model' },
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
        summary: 'Get single workflow',
        description: [
          'Get details of a single workflow. Use `appends` to include nodes and statistics.',
          '',
          'Example:',
          '```',
          'GET /api/workflows:get?filterByTk=1&appends[]=nodes&appends[]=versionStats',
          '```',
        ].join('\n'),
        parameters: [
          { $ref: '#/components/schemas/workflow/filterByTk' },
          { $ref: '#/components/schemas/workflow/filter' },
          {
            name: 'appends',
            in: 'query',
            description: 'Append associations: `nodes`, `stats`, `versionStats`, `executions`',
            schema: { type: 'array', items: { type: 'string' } },
          },
          {
            name: 'except',
            in: 'query',
            description: 'Exclude fields from response',
            schema: { type: 'array', items: { type: 'string' } },
          },
        ],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/workflow/model' },
                    {
                      type: 'object',
                      properties: {
                        nodes: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/node' },
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
        summary: 'Create new workflow',
        description: [
          'Create a new workflow. The `type` (trigger type) must be specified at creation time.',
          '',
          'Note: `sync` mode (synchronous/asynchronous execution) **cannot be changed after creation**.',
        ].join('\n'),
        parameters: [],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'type'],
                properties: {
                  title: { $ref: '#/components/schemas/workflow/model/properties/title' },
                  type: { $ref: '#/components/schemas/workflow/model/properties/type' },
                  description: { $ref: '#/components/schemas/workflow/model/properties/description' },
                  enabled: { $ref: '#/components/schemas/workflow/model/properties/enabled' },
                  sync: { $ref: '#/components/schemas/workflow/model/properties/sync' },
                  triggerTitle: { $ref: '#/components/schemas/workflow/model/properties/triggerTitle' },
                  config: { $ref: '#/components/schemas/workflow/model/properties/config' },
                  options: { $ref: '#/components/schemas/workflow/model/properties/options' },
                  categories: { $ref: '#/components/schemas/workflow/model/properties/categories' },
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
                schema: { $ref: '#/components/schemas/workflow/model' },
              },
            },
          },
        },
      },
    },

    '/workflows:update': {
      post: {
        tags: ['workflows'],
        summary: 'Update a workflow',
        description: [
          'Update workflow properties.',
          '',
          'Allowed fields (server-side whitelist): `title`, `description`, `enabled`, `triggerTitle`, `config`, `options`, `categories`.',
          '',
          '**Constraint:** `config` (trigger configuration) cannot be updated if the workflow version',
          'has already been executed (`versionStats.executed > 0`). Create a new revision instead.',
        ].join('\n'),
        parameters: [{ $ref: '#/components/schemas/workflow/filterByTk' }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { $ref: '#/components/schemas/workflow/model/properties/title' },
                  enabled: { $ref: '#/components/schemas/workflow/model/properties/enabled' },
                  description: { $ref: '#/components/schemas/workflow/model/properties/description' },
                  triggerTitle: { $ref: '#/components/schemas/workflow/model/properties/triggerTitle' },
                  config: { $ref: '#/components/schemas/workflow/model/properties/config' },
                  options: { $ref: '#/components/schemas/workflow/model/properties/options' },
                  categories: { $ref: '#/components/schemas/workflow/model/properties/categories' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'OK' },
          400: {
            description: 'Bad Request. `config` cannot be updated when the workflow version has already been executed.',
          },
        },
      },
    },

    '/workflows:destroy': {
      post: {
        tags: ['workflows'],
        summary: 'Delete workflows',
        description: [
          'Delete one or more workflows, along with all their nodes and execution records.',
          '',
          '- If `filterByTk` targets a **current** (latest) version, **all other revisions** sharing',
          '  the same `key` are also deleted automatically.',
          '- If `filter.key` is provided, all versions sharing that key are deleted.',
        ].join('\n'),
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            description: 'ID of the workflow to delete',
            schema: { type: 'integer' },
          },
          {
            name: 'filter',
            in: 'query',
            description: 'Filter to select workflows for deletion',
            schema: {
              type: 'object',
              properties: {
                key: {
                  type: 'string',
                  description: 'Workflow key. All versions sharing this key will be deleted.',
                },
              },
            },
          },
        ],
        responses: {
          200: { description: 'OK' },
        },
      },
    },

    '/workflows:revision': {
      post: {
        tags: ['workflows'],
        summary: 'Duplicate a workflow (create a revision)',
        description: [
          'Duplicate an existing workflow. All nodes are duplicated too.',
          '',
          '- If `filter.key` is provided, creates a **new version** under the same key (version control).',
          '- Otherwise, creates an independent copy as a **new workflow** with a new key.',
          '',
          'The new workflow/version is created with `enabled: false` and `current: false` by default',
          'unless overridden via `values`.',
        ].join('\n'),
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            description: 'ID of the workflow to duplicate',
            schema: { type: 'integer' },
          },
          {
            name: 'filter',
            in: 'query',
            description: 'Filter options',
            schema: {
              type: 'object',
              properties: {
                key: {
                  type: 'string',
                  description:
                    'If provided, creates a new version under the same key. Otherwise duplicates as a new workflow.',
                },
              },
            },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                description: 'Override fields for the new workflow/version',
                properties: {
                  title: { type: 'string', description: 'Override title' },
                  enabled: { type: 'boolean', description: 'Override enabled state' },
                  current: { type: 'boolean', description: 'Set as current version' },
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
                schema: { $ref: '#/components/schemas/workflow/model' },
              },
            },
          },
        },
      },
    },

    '/workflows:sync': {
      post: {
        tags: ['workflows'],
        summary: 'Sync workflow trigger registration',
        description: [
          'Re-register one or more workflows in the trigger system.',
          '',
          "This is used to reload a workflow's trigger listener after its configuration has been",
          'changed directly in the database or via external tooling, bypassing the normal update API.',
          '',
          'Returns HTTP 204 No Content on success.',
        ].join('\n'),
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            description: 'ID of the workflow to sync',
            schema: { type: 'integer' },
          },
          {
            name: 'filter',
            in: 'query',
            description: 'Filter to select multiple workflows to sync',
            schema: { type: 'object' },
          },
        ],
        responses: {
          204: { description: 'No Content. Sync successful.' },
        },
      },
    },

    '/workflows:execute': {
      post: {
        tags: ['workflows'],
        summary: 'Manually execute a workflow',
        description: [
          'Manually trigger execution of a workflow by ID.',
          '',
          '**Requirements:**',
          '- `filterByTk` (query param) is required.',
          '- Request body is required — the **entire JSON body** is treated as trigger context/input.',
          '',
          '**autoRevision:** When set to `1`, if the workflow has never been executed',
          '(`executed === 0`), a new revision is created automatically after execution.',
          '',
          '**Returns:** `{ execution: { id, status }, newVersionId? }`',
        ].join('\n'),
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            required: true,
            description: 'ID of the workflow to execute',
            schema: { type: 'integer' },
          },
          {
            name: 'autoRevision',
            in: 'query',
            description: 'If `1`, automatically create a new revision after the first execution',
            schema: { type: 'integer', enum: [0, 1] },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                description:
                  'Trigger context/input data. The body itself is mapped to `params.values` on the server. Structure depends on trigger type.',
                additionalProperties: true,
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
                  type: 'object',
                  properties: {
                    execution: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer', description: 'Execution ID' },
                        status: { type: 'integer', description: 'Execution status code' },
                      },
                    },
                    newVersionId: {
                      type: 'integer',
                      nullable: true,
                      description: 'ID of the newly created revision, if autoRevision was triggered',
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Bad Request. Request body or `filterByTk` is missing/invalid, or workflow not triggered.',
          },
          404: { description: 'Not Found. Workflow does not exist.' },
        },
      },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // workflows.nodes (association: create node within a workflow)
    // ─────────────────────────────────────────────────────────────────────────

    '/workflows/{workflowId}/nodes:create': {
      post: {
        tags: ['workflows.nodes'],
        summary: 'Create a node in a workflow',
        description: [
          'Create a new node inside the specified workflow.',
          '',
          '**Insertion logic:**',
          '- `upstreamId: null` — node becomes the new head; the previous head (if any) becomes its downstream.',
          '- `branchIndex: null` — node is inserted in the main chain after `upstreamId`.',
          '- `branchIndex: <n>` — node becomes the head of branch `n` from `upstreamId`.',
          '',
          '**Constraint:** Cannot create nodes in a workflow version that has already been executed.',
          'An optional `WORKFLOW_NODES_LIMIT` env var caps the total number of nodes allowed per workflow.',
        ].join('\n'),
        parameters: [
          {
            name: 'workflowId',
            in: 'path',
            required: true,
            description: 'Workflow ID',
            schema: { type: 'integer' },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['type'],
                properties: {
                  type: { $ref: '#/components/schemas/node/properties/type' },
                  title: { $ref: '#/components/schemas/node/properties/title' },
                  config: { $ref: '#/components/schemas/node/properties/config' },
                  upstreamId: { $ref: '#/components/schemas/node/properties/upstreamId' },
                  branchIndex: { $ref: '#/components/schemas/node/properties/branchIndex' },
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
                  allOf: [{ $ref: '#/components/schemas/node' }],
                },
              },
            },
          },
          400: {
            description:
              'Bad Request. Cannot create node in an already-executed workflow version, or node limit exceeded.',
          },
        },
      },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // flow_nodes
    // ─────────────────────────────────────────────────────────────────────────

    '/flow_nodes:get': {
      get: {
        tags: ['flow_nodes'],
        summary: 'Get single node',
        description: 'Get details of a single flow node.',
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            required: true,
            description: 'Node ID',
            schema: { type: 'integer' },
          },
          {
            name: 'appends',
            in: 'query',
            description: 'Append associations (e.g. `upstream`, `downstream`)',
            schema: { type: 'array', items: { type: 'string' } },
          },
        ],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/node' },
              },
            },
          },
        },
      },
    },

    '/flow_nodes:update': {
      post: {
        tags: ['flow_nodes'],
        summary: 'Update node properties',
        description: [
          'Update properties or configuration of a flow node.',
          '',
          '**Constraint:** Cannot update nodes in a workflow version that has already been executed',
          '(`versionStats.executed > 0`).',
          '',
          '`updateAssociationValues` can be used to update linked nodes simultaneously,',
          'e.g. when re-connecting upstream/downstream after inserting a new node.',
        ].join('\n'),
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            required: true,
            description: 'Node ID',
            schema: { type: 'integer' },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { $ref: '#/components/schemas/node/properties/title' },
                  config: { $ref: '#/components/schemas/node/properties/config' },
                  branchIndex: { $ref: '#/components/schemas/node/properties/branchIndex' },
                  updateAssociationValues: {
                    type: 'array',
                    description:
                      'Association fields to update simultaneously (e.g. `["upstream"]` to reconnect upstream node)',
                    items: { type: 'string' },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'OK' },
          400: {
            description: 'Bad Request. Node in executed workflow cannot be updated.',
          },
        },
      },
    },

    '/flow_nodes:destroy': {
      post: {
        tags: ['flow_nodes'],
        summary: 'Delete a node',
        description: [
          'Delete a node from the workflow. All nodes in sub-branches are also deleted by default.',
          '',
          '**keepBranch:** Optionally preserve one branch by specifying its `branchIndex`.',
          "The kept branch will be reconnected to the deleted node's upstream/downstream.",
          '',
          '**Constraint:** Cannot delete nodes in a workflow version that has already been executed.',
        ].join('\n'),
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            required: true,
            description: 'Node ID',
            schema: { type: 'integer' },
          },
          {
            name: 'keepBranch',
            in: 'query',
            description: 'Branch index to preserve (all other branches will be deleted)',
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: { description: 'OK' },
          400: {
            description: 'Bad Request. Node in executed workflow cannot be deleted.',
          },
        },
      },
    },

    '/flow_nodes:destroyBranch': {
      post: {
        tags: ['flow_nodes'],
        summary: 'Delete a specific branch of a branching node',
        description: [
          'Delete all nodes under a specific branch of a branching node (e.g. a condition node).',
          '',
          '**shift:** If `1`, branches with a higher `branchIndex` are shifted down by 1',
          'to keep indexes contiguous after deletion.',
          '',
          '**Constraint:** Cannot delete branches in a workflow version that has already been executed.',
        ].join('\n'),
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            required: true,
            description: 'ID of the parent branching node',
            schema: { type: 'integer' },
          },
          {
            name: 'branchIndex',
            in: 'query',
            required: true,
            description: 'Index of the branch to delete',
            schema: { type: 'integer' },
          },
          {
            name: 'shift',
            in: 'query',
            description: 'If `1`, shift remaining branch indexes down after deletion',
            schema: { type: 'integer', enum: [0, 1] },
          },
        ],
        responses: {
          200: { description: 'OK' },
          400: {
            description:
              'Bad Request. Branch in executed workflow cannot be deleted, or `branchIndex` is missing/invalid.',
          },
        },
      },
    },

    '/flow_nodes:duplicate': {
      post: {
        tags: ['flow_nodes'],
        summary: 'Duplicate a node',
        description: [
          'Duplicate an existing node to a new position in the same workflow.',
          "The node's `type`, `title`, and `config` are copied. If the instruction defines a",
          '`duplicateConfig` method, it is called to transform the config during duplication.',
          '',
          '**Constraint:** Cannot duplicate into a workflow version that has already been executed.',
          'An optional `WORKFLOW_NODES_LIMIT` env var caps the total number of nodes allowed.',
        ].join('\n'),
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            required: true,
            description: 'ID of the source node to duplicate',
            schema: { type: 'integer' },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                description: 'Target position and optional config override for the new node',
                properties: {
                  upstreamId: { $ref: '#/components/schemas/node/properties/upstreamId' },
                  branchIndex: { $ref: '#/components/schemas/node/properties/branchIndex' },
                  config: { $ref: '#/components/schemas/node/properties/config' },
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
                schema: { $ref: '#/components/schemas/node' },
              },
            },
          },
          400: {
            description: 'Bad Request. Cannot duplicate node in executed workflow, or node limit exceeded.',
          },
          404: { description: 'Not Found. Source node not found.' },
        },
      },
    },

    '/flow_nodes:move': {
      post: {
        tags: ['flow_nodes'],
        summary: 'Move a node to a different position',
        description: [
          'Move a node to a new position in the workflow graph.',
          'Upstream/downstream connections of both the old and new positions are automatically re-linked.',
          '',
          '**Target position (in `values`):**',
          '- `upstreamId: null` — move node to the head of the workflow.',
          '- `upstreamId: <id>` + `branchIndex: null` — insert into the main chain after that node.',
          '- `upstreamId: <id>` + `branchIndex: <n>` — insert as head of branch `n` from that node.',
          '',
          '**Constraint:** Cannot move nodes in a workflow version that has already been executed.',
        ].join('\n'),
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            required: true,
            description: 'ID of the node to move',
            schema: { type: 'integer' },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                description: 'Target position descriptor',
                properties: {
                  upstreamId: {
                    type: 'integer',
                    nullable: true,
                    description: 'Target upstream node ID. `null` = move to head position.',
                  },
                  branchIndex: {
                    type: 'integer',
                    nullable: true,
                    description: 'Branch index at the target upstream. `null` = main chain.',
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
                schema: { $ref: '#/components/schemas/node' },
              },
            },
          },
          400: {
            description: 'Bad Request. Cannot move node in executed workflow, or target position is invalid.',
          },
          404: { description: 'Not Found. Node or target upstream node not found.' },
        },
      },
    },

    '/flow_nodes:test': {
      post: {
        tags: ['flow_nodes'],
        summary: 'Test a node configuration',
        description: [
          "Test a node's configuration without creating a real workflow execution.",
          'Only applicable to node types whose instruction implements a `test` method.',
          '',
          "Returns the result produced by the instruction's `test(config)` method.",
        ].join('\n'),
        parameters: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['type', 'config'],
                properties: {
                  type: { $ref: '#/components/schemas/node/properties/type' },
                  config: { $ref: '#/components/schemas/node/properties/config' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'OK. Returns the test result from the instruction.',
            content: {
              'application/json': {
                schema: { type: 'object' },
              },
            },
          },
          400: {
            description: 'Bad Request. Node type not registered or `test` method not implemented.',
          },
          500: { description: 'Internal Server Error. Test execution threw an error.' },
        },
      },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // executions
    // ─────────────────────────────────────────────────────────────────────────

    '/executions:list': {
      get: {
        tags: ['executions'],
        summary: 'List executions',
        description: [
          'Get paginated list of workflow execution records.',
          '',
          'Example:',
          '```',
          'GET /api/executions:list?filter={"workflowId":1}&sort=-id&page=1&pageSize=20',
          '```',
        ].join('\n'),
        parameters: [
          {
            name: 'filter',
            in: 'query',
            description: 'Filter conditions (e.g. `{ workflowId: 1, status: 1 }`)',
            schema: { type: 'object' },
          },
          {
            name: 'appends',
            in: 'query',
            description: 'Append associations (e.g. `jobs`, `workflow`)',
            schema: { type: 'array', items: { type: 'string' } },
          },
          {
            name: 'except',
            in: 'query',
            description: 'Exclude fields to reduce payload',
            schema: { type: 'array', items: { type: 'string' } },
          },
          {
            name: 'sort',
            in: 'query',
            description: 'Sort fields. Prefix with `-` for descending. e.g. `-id`',
            schema: { type: 'string' },
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'pageSize',
            in: 'query',
            schema: { type: 'integer', default: 20 },
          },
        ],
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
        summary: 'Get single execution',
        description: [
          'Get details of a single execution. Use `appends` to include jobs, workflow and node data.',
          '',
          'Example:',
          '```',
          'GET /api/executions:get?filterByTk=1&appends[]=jobs&appends[]=workflow&appends[]=workflow.nodes',
          '```',
        ].join('\n'),
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            required: true,
            description: 'Execution ID',
            schema: { type: 'integer' },
          },
          {
            name: 'appends',
            in: 'query',
            description:
              'Append associations: `jobs`, `workflow`, `workflow.nodes`, `workflow.versionStats`, `workflow.stats`',
            schema: { type: 'array', items: { type: 'string' } },
          },
          {
            name: 'except',
            in: 'query',
            description: 'Exclude fields to reduce payload (e.g. `jobs.result`, `workflow.options`)',
            schema: { type: 'array', items: { type: 'string' } },
          },
        ],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/execution' },
              },
            },
          },
        },
      },
    },

    '/executions:cancel': {
      post: {
        tags: ['executions'],
        summary: 'Cancel a running execution',
        description: [
          'Abort a currently running execution.',
          'Sets the execution status to `ABORTED` (-3) and all `PENDING` (0) jobs to `ABORTED` (-3).',
          '',
          '**Constraint:** Only executions with `status = 0` (STARTED) can be cancelled.',
          '',
          'Returns the updated execution record.',
        ].join('\n'),
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            required: true,
            description: 'Execution ID',
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: {
            description: 'OK. Returns the updated execution.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/execution' },
              },
            },
          },
          400: {
            description: 'Bad Request. Execution has already ended (status ≠ 0).',
          },
          404: { description: 'Not Found. Execution does not exist.' },
        },
      },
    },

    '/executions:destroy': {
      post: {
        tags: ['executions'],
        summary: 'Delete execution records',
        description: [
          'Delete one or more execution records.',
          '**Running executions (`status = 0`, STARTED) cannot be deleted.**',
          'Call `executions:cancel` first if you need to delete a running execution.',
        ].join('\n'),
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            description: 'Execution ID',
            schema: { type: 'integer' },
          },
          {
            name: 'filter',
            in: 'query',
            description: 'Filter for batch deletion. Running executions are automatically excluded from deletion.',
            schema: { type: 'object' },
          },
        ],
        responses: {
          200: { description: 'OK' },
        },
      },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // jobs
    // ─────────────────────────────────────────────────────────────────────────

    '/jobs:list': {
      get: {
        tags: ['jobs'],
        summary: 'List jobs',
        description:
          'Get list of node job records. Usually more convenient to access via `executions:get` with `appends: ["jobs"]`.',
        parameters: [
          {
            name: 'filter',
            in: 'query',
            description: 'Filter conditions (e.g. `{ executionId: 1 }`, `{ nodeId: 2 }`)',
            schema: { type: 'object' },
          },
          {
            name: 'appends',
            in: 'query',
            description: 'Append associations',
            schema: { type: 'array', items: { type: 'string' } },
          },
          {
            name: 'sort',
            in: 'query',
            schema: { type: 'string' },
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer' },
          },
          {
            name: 'pageSize',
            in: 'query',
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/job' },
                },
              },
            },
          },
        },
      },
    },

    '/jobs:get': {
      get: {
        tags: ['jobs'],
        summary: 'Get single job',
        description: 'Get details of a single node job record.',
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            required: true,
            description: 'Job ID',
            schema: { type: 'integer' },
          },
          {
            name: 'appends',
            in: 'query',
            description: 'Append associations',
            schema: { type: 'array', items: { type: 'string' } },
          },
        ],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/job' },
              },
            },
          },
        },
      },
    },

    '/jobs:resume': {
      post: {
        tags: ['jobs'],
        summary: 'Resume execution via a job',
        description: [
          "Update a job's fields and signal the workflow processor to resume the paused execution.",
          '',
          'This is the mechanism for continuing execution after a waiting/interactive node',
          '(e.g. manual processing, approval) has been handled.',
          '',
          'The job must exist. After the update the execution is resumed asynchronously.',
          '',
          'Returns HTTP 202 Accepted with the updated job.',
        ].join('\n'),
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            required: true,
            description: 'Job ID',
            schema: { type: 'integer' },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                description: 'Fields to update on the job before resuming',
                properties: {
                  status: {
                    type: 'integer',
                    description: 'Job status: 1=RESOLVED, -1=FAILED, -3=ABORTED, -4=CANCELED, -5=REJECTED',
                  },
                  result: {
                    type: 'object',
                    description: 'Result data to store on the job',
                  },
                  meta: {
                    type: 'object',
                    description: 'Metadata to store on the job',
                  },
                },
              },
            },
          },
        },
        responses: {
          202: {
            description: 'Accepted. Job updated and execution resume signalled.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/job' },
              },
            },
          },
          404: { description: 'Not Found. Job does not exist.' },
        },
      },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // userWorkflowTasks
    // ─────────────────────────────────────────────────────────────────────────

    '/userWorkflowTasks:listMine': {
      get: {
        tags: ['userWorkflowTasks'],
        summary: 'List my workflow tasks',
        description: [
          'Get workflow tasks assigned to the currently logged-in user.',
          'The server automatically injects `userId = currentUser.id` into the filter.',
          '',
          'This is the base action for listing user-specific interactive tasks.',
          'Extension plugins (e.g. plugin-workflow-manual, plugin-workflow-approval) may',
          'provide additional task-type-specific actions on this same resource.',
        ].join('\n'),
        parameters: [
          {
            name: 'filter',
            in: 'query',
            description: 'Additional filter conditions',
            schema: { type: 'object' },
          },
          {
            name: 'appends',
            in: 'query',
            description: 'Append associations',
            schema: { type: 'array', items: { type: 'string' } },
          },
          {
            name: 'sort',
            in: 'query',
            schema: { type: 'string' },
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer' },
          },
          {
            name: 'pageSize',
            in: 'query',
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/user_job' },
                },
              },
            },
          },
        },
      },
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Schemas
  // ───────────────────────────────────────────────────────────────────────────

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
              description: 'Version group key. All versions of the same workflow share the same key.',
            },
            title: {
              type: 'string',
              description: 'Title',
            },
            description: {
              type: 'string',
              description: 'Description',
            },
            triggerTitle: {
              type: 'string',
              description: 'Trigger display label (optional, UI only)',
            },
            current: {
              type: 'boolean',
              description: 'Whether this is the active version. Only one version per `key` can have `current: true`.',
            },
            enabled: {
              type: 'boolean',
              description: 'Whether the workflow is enabled. Enabling registers the trigger listener.',
            },
            type: {
              type: 'string',
              description: 'Trigger type (e.g. `collection`, `schedule`)',
            },
            sync: {
              type: 'boolean',
              description:
                'Synchronous execution mode. `true` = execute immediately and return; `false` = queue async. Cannot be changed after creation.',
            },
            config: {
              type: 'object',
              description: 'Trigger configuration JSON object. Structure depends on `type`.',
            },
            options: {
              type: 'object',
              description: 'Engine options',
              properties: {
                deleteExecutionOnStatus: {
                  type: 'array',
                  description: 'Auto-delete execution records when they reach any of these status codes.',
                  items: { type: 'integer' },
                },
                stackLimit: {
                  type: 'integer',
                  description: 'Maximum recursive trigger depth. Executions beyond this limit are skipped. Default: 1.',
                  default: 1,
                },
              },
            },
            categories: {
              type: 'array',
              description: 'Category IDs (belongsToMany `workflowCategories`)',
              items: { type: 'integer' },
            },
            nodes: {
              type: 'array',
              description: 'Workflow nodes (association)',
            },
            executions: {
              type: 'array',
              description: 'Executions (association)',
            },
            revisions: {
              type: 'array',
              description: 'Other versions sharing the same `key` (association)',
            },
          },
        },
        filterByTk: {
          name: 'filterByTk',
          in: 'query',
          description: 'Primary key (ID) of the workflow',
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
            nullable: true,
            description: 'Upstream node ID. `null` means this is the first node (head) after the trigger.',
          },
          upstream: {
            type: 'object',
            description: 'Upstream node (association)',
            $ref: '#/components/schemas/node',
          },
          downstreamId: {
            type: 'integer',
            nullable: true,
            description: 'Downstream node ID in the main chain (not counting sub-branches)',
          },
          downstream: {
            type: 'object',
            description: 'Downstream node (association)',
            $ref: '#/components/schemas/node',
          },
          type: {
            type: 'string',
            description: 'Node type (e.g. `calculation`, `condition`, `query`, `create`, `update`, `destroy`)',
          },
          config: {
            type: 'object',
            description: 'Node configuration JSON object. Structure depends on the node `type`.',
          },
          branchIndex: {
            type: 'integer',
            nullable: true,
            description: 'Branch index. Non-null when the node is the head of a branch from its upstream.',
          },
          branches: {
            type: 'array',
            description: 'Branch head nodes of this node (association)',
            items: {
              $ref: '#/components/schemas/node',
            },
          },
        },
      },
      execution: {
        type: 'object',
        description: 'Workflow execution record',
        properties: {
          id: {
            type: 'integer',
            description: 'ID',
          },
          key: {
            type: 'string',
            description: 'Workflow key (version group identifier)',
          },
          workflowId: {
            type: 'integer',
            description: 'Workflow version ID',
          },
          context: {
            type: 'object',
            description: 'Trigger context data passed at the time of execution',
          },
          status: {
            type: 'integer',
            description: [
              'Execution status code:',
              '- `null` : QUEUEING (waiting to start)',
              '- `0`    : STARTED (running)',
              '- `1`    : RESOLVED (completed successfully)',
              '- `-1`   : FAILED',
              '- `-2`   : ERROR',
              '- `-3`   : ABORTED (forcibly cancelled)',
              '- `-4`   : CANCELED',
              '- `-5`   : REJECTED',
              '- `-6`   : RETRY_NEEDED',
            ].join('\n'),
          },
          output: {
            type: 'object',
            description: 'Output node results',
          },
          jobs: {
            type: 'array',
            description: 'Node job results (included when `appends: ["jobs"]`)',
            items: {
              $ref: '#/components/schemas/job',
            },
          },
        },
      },
      job: {
        type: 'object',
        description: 'Node job execution record',
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
          nodeKey: {
            type: 'string',
            description: 'Node key (for cross-version reference)',
          },
          status: {
            type: 'integer',
            description: [
              'Job status code:',
              '- `0`  : PENDING (waiting, e.g. manual node)',
              '- `1`  : RESOLVED (completed)',
              '- `-1` : FAILED',
              '- `-2` : ERROR',
              '- `-3` : ABORTED',
              '- `-4` : CANCELED',
              '- `-5` : REJECTED',
              '- `-6` : RETRY_NEEDED',
            ].join('\n'),
          },
          result: {
            type: 'object',
            description: 'Result data of the job',
          },
          meta: {
            type: 'object',
            description: 'Metadata of the job',
          },
        },
      },
      user_job: {
        type: 'object',
        description: 'User workflow task (an interactive task assigned to a specific user)',
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
            description: 'Assigned user ID',
          },
          status: {
            type: 'integer',
            description: 'Task status (same enum as JOB_STATUS)',
          },
          result: {
            type: 'object',
            description: 'Task result data',
          },
        },
      },
    },
  },
};
