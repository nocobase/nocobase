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
    title: 'NocoBase API - Flow engine plugin',
  },
  paths: {
    '/flowModels:findOne': {
      get: {
        tags: ['flowModels'],
        description:
          'Find a flow model by uid, or find a child model by parentId + subKey. Use includeAsyncNode to include async subtrees.',
        parameters: [
          {
            name: 'uid',
            in: 'query',
            required: false,
            schema: { type: 'string' },
          },
          {
            name: 'parentId',
            in: 'query',
            required: false,
            schema: { type: 'string' },
          },
          {
            name: 'subKey',
            in: 'query',
            required: false,
            schema: { type: 'string' },
          },
          {
            name: 'includeAsyncNode',
            in: 'query',
            required: false,
            schema: { type: 'boolean', default: false },
          },
        ],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  anyOf: [{ $ref: '#/components/schemas/FlowModelSnapshot' }, { type: 'null' }],
                },
              },
            },
          },
        },
      },
    },
    '/flowModels:schema': {
      get: {
        tags: ['flowModels'],
        description:
          'Get the server-side JSON Schema document for a specific flow model use. Use this discovery endpoint before composing flowModels:save/ensure/mutate payloads.',
        parameters: [{ name: 'use', in: 'query', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/FlowModelSchemaDocument' },
              },
            },
          },
          404: {
            description: 'Not Found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
          400: {
            description: 'Bad Request',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/flowModels:schemas': {
      post: {
        tags: ['flowModels'],
        description:
          'Batch fetch flow model JSON Schema documents. When uses is empty or omitted, returns the current schema index visible to the server.',
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/FlowModelSchemasRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/FlowModelSchemaDocument' },
                },
              },
            },
          },
        },
      },
    },
    '/flowModels:schemaBundle': {
      post: {
        tags: ['flowModels'],
        description:
          'Fetch a compact schema bootstrap bundle for LLM prompts. Returns coverage stats, minimal examples, skeletons, common patterns, and key enums.',
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/FlowModelSchemasRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/FlowModelSchemaBundleDocument' },
              },
            },
          },
        },
      },
    },
    '/flowModels:save': {
      post: {
        tags: ['flowModels'],
        description:
          'Upsert a flow model tree. Discover model-specific JSON Schema first via flowModels:schema / flowModels:schemas. By default returns the saved model snapshot; use query param return=uid to get only the root uid string.',
        parameters: [
          {
            name: 'return',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['model', 'uid'],
              default: 'model',
            },
          },
          {
            name: 'includeAsyncNode',
            in: 'query',
            required: false,
            schema: { type: 'boolean', default: false },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/FlowModelSnapshot',
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
                  oneOf: [{ $ref: '#/components/schemas/FlowModelSnapshot' }, { type: 'string' }],
                },
              },
            },
          },
          400: {
            description: 'Bad Request',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/flowModels:duplicate': {
      post: {
        tags: ['flowModels'],
        description: 'Duplicate a flow model subtree (legacy, non-deterministic uids).',
        parameters: [{ name: 'uid', in: 'query', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: { anyOf: [{ $ref: '#/components/schemas/FlowModelSnapshot' }, { type: 'null' }] },
              },
            },
          },
        },
      },
    },
    '/flowModels:attach': {
      post: {
        tags: ['flowModels'],
        description: 'Attach an existing model subtree to a parent under subKey/subType (with cycle detection).',
        parameters: [
          { name: 'uid', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'parentId', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'subKey', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'subType', in: 'query', required: true, schema: { type: 'string', enum: ['object', 'array'] } },
          {
            name: 'position',
            in: 'query',
            required: false,
            schema: { type: 'string', description: "Array-only ordering hint: 'first' | 'last'." },
          },
        ],
        responses: {
          200: {
            description: 'OK',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/FlowModelSnapshot' } } },
          },
        },
      },
    },
    '/flowModels:move': {
      post: {
        tags: ['flowModels'],
        description: "Move a model relative to a sibling (position='before'|'after').",
        parameters: [
          { name: 'sourceId', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'targetId', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'position', in: 'query', required: true, schema: { type: 'string', enum: ['before', 'after'] } },
        ],
        responses: {
          200: {
            description: 'OK',
            content: { 'application/json': { schema: { type: 'string', example: 'ok' } } },
          },
        },
      },
    },
    '/flowModels:destroy': {
      post: {
        tags: ['flowModels'],
        description: 'Destroy a model subtree by uid (filterByTk).',
        parameters: [{ name: 'filterByTk', in: 'query', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'OK',
            content: { 'application/json': { schema: { type: 'string', example: 'ok' } } },
          },
        },
      },
    },
    '/flowModels:ensure': {
      post: {
        tags: ['flowModels'],
        description:
          'Ensure a flow model exists (create if missing). Supports ensure by uid, or ensure an object child model by parentId+subKey+subType=object. Discover model-specific JSON Schema first via flowModels:schema / flowModels:schemas.',
        parameters: [
          {
            name: 'includeAsyncNode',
            in: 'query',
            required: false,
            schema: { type: 'boolean', default: false },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/FlowModelEnsureRequest',
              },
              examples: {
                ensureByUid: {
                  summary: 'Ensure by uid',
                  value: {
                    uid: 'page-uid-001',
                    use: 'RouteModel',
                    async: false,
                  },
                },
                ensureObjectChild: {
                  summary: 'Ensure object child by parentId+subKey',
                  value: {
                    parentId: 'page-uid-001',
                    subKey: 'page',
                    subType: 'object',
                    use: 'RootPageModel',
                    async: true,
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
                schema: { $ref: '#/components/schemas/FlowModelSnapshot' },
              },
            },
          },
          400: {
            description: 'Bad Request',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
          404: {
            description: 'Not Found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
          409: {
            description: 'Conflict',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/flowModels:mutate': {
      post: {
        tags: ['flowModels'],
        description:
          'Run multiple flowModels operations in one HTTP request and one transaction. Supports $ref chaining across ops outputs. Discover model-specific JSON Schema first via flowModels:schema / flowModels:schemas.',
        parameters: [
          {
            name: 'includeAsyncNode',
            in: 'query',
            required: false,
            schema: { type: 'boolean', default: false },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/FlowModelsMutateRequest' },
              examples: {
                duplicateAttachMoveUpsert: {
                  summary: 'duplicate -> attach -> move -> upsert (with $ref)',
                  value: {
                    atomic: true,
                    ops: [
                      { opId: 'dup', type: 'duplicate', params: { uid: 'source-uid', targetUid: 'target-uid' } },
                      {
                        opId: 'att',
                        type: 'attach',
                        params: {
                          uid: '$ref:dup.uid',
                          parentId: 'parent-uid',
                          subKey: 'items',
                          subType: 'array',
                          position: 'last',
                        },
                      },
                      {
                        opId: 'mv',
                        type: 'move',
                        params: { sourceId: '$ref:dup.uid', targetId: 'sibling-uid', position: 'before' },
                      },
                      { opId: 'up', type: 'upsert', params: { values: { uid: 'parent-uid', use: 'ParentModel' } } },
                    ],
                    returnModels: ['parent-uid', 'target-uid'],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'OK',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/FlowModelsMutateResponse' } } },
          },
          400: {
            description: 'Bad Request',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
          404: {
            description: 'Not Found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
          409: {
            description: 'Conflict',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
          500: {
            description: 'Internal Error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      ErrorItem: {
        type: 'object',
        required: ['message'],
        properties: {
          code: { type: 'string' },
          message: { type: 'string' },
          details: { type: 'object', additionalProperties: true },
          opId: { type: 'string' },
          opIndex: { type: 'number' },
          jsonPointer: { type: 'string' },
          modelUid: { type: 'string' },
          modelUse: { type: 'string' },
          section: { type: 'string' },
          keyword: { type: 'string' },
          expectedType: { oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] },
          allowedValues: { type: 'array', items: {} },
          suggestedUses: { type: 'array', items: { type: 'string' } },
          schemaHash: { type: 'string' },
        },
        additionalProperties: true,
      },
      ErrorResponse: {
        type: 'object',
        required: ['errors'],
        properties: {
          errors: { type: 'array', items: { $ref: '#/components/schemas/ErrorItem' } },
        },
        additionalProperties: true,
      },
      FlowModelEnsureRequest: {
        oneOf: [
          {
            type: 'object',
            required: ['uid', 'use'],
            properties: {
              uid: { type: 'string' },
              use: { type: 'string' },
              async: { type: 'boolean' },
              stepParams: { type: 'object', additionalProperties: true },
              flowRegistry: { type: 'object', additionalProperties: true },
              subModels: { type: 'object', additionalProperties: true },
            },
            additionalProperties: true,
          },
          {
            type: 'object',
            required: ['parentId', 'subKey', 'subType', 'use'],
            properties: {
              parentId: { type: 'string' },
              subKey: { type: 'string' },
              subType: { type: 'string', enum: ['object'] },
              use: { type: 'string' },
              async: { type: 'boolean' },
              stepParams: { type: 'object', additionalProperties: true },
              flowRegistry: { type: 'object', additionalProperties: true },
              subModels: { type: 'object', additionalProperties: true },
            },
            additionalProperties: true,
          },
        ],
      },
      FlowDynamicHint: {
        type: 'object',
        required: ['kind', 'message'],
        properties: {
          kind: { type: 'string' },
          path: { type: 'string' },
          message: { type: 'string' },
          'x-flow': {
            type: 'object',
            properties: {
              slotRules: {
                type: 'object',
                properties: {
                  slotKey: { type: 'string' },
                  type: { type: 'string', enum: ['object', 'array'] },
                  allowedUses: { type: 'array', items: { type: 'string' } },
                },
                additionalProperties: false,
              },
              contextRequirements: { type: 'array', items: { type: 'string' } },
              unresolvedReason: { type: 'string' },
              recommendedFallback: {},
            },
            additionalProperties: false,
          },
        },
        additionalProperties: false,
      },
      FlowSchemaPattern: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          snippet: {},
        },
        additionalProperties: false,
      },
      FlowSchemaCoverage: {
        type: 'object',
        required: ['status', 'source'],
        properties: {
          status: { type: 'string', enum: ['auto', 'manual', 'mixed', 'unresolved'] },
          source: { type: 'string', enum: ['official', 'plugin', 'third-party'] },
          strict: { type: 'boolean' },
          issues: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
      FlowModelSchemasRequest: {
        type: 'object',
        properties: {
          uses: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
      FlowSchemaRegistrySummary: {
        type: 'object',
        required: [
          'registeredModels',
          'registeredActions',
          'strictModels',
          'unresolvedModels',
          'officialModels',
          'pluginModels',
          'thirdPartyModels',
        ],
        properties: {
          registeredModels: { type: 'number' },
          registeredActions: { type: 'number' },
          strictModels: { type: 'number' },
          unresolvedModels: { type: 'number' },
          officialModels: { type: 'number' },
          pluginModels: { type: 'number' },
          thirdPartyModels: { type: 'number' },
        },
        additionalProperties: false,
      },
      FlowModelSchemaDocument: {
        type: 'object',
        required: [
          'use',
          'jsonSchema',
          'coverage',
          'dynamicHints',
          'examples',
          'commonPatterns',
          'antiPatterns',
          'skeleton',
          'hash',
          'source',
        ],
        properties: {
          use: { type: 'string' },
          title: { type: 'string' },
          jsonSchema: { type: 'object', additionalProperties: true },
          coverage: { $ref: '#/components/schemas/FlowSchemaCoverage' },
          dynamicHints: { type: 'array', items: { $ref: '#/components/schemas/FlowDynamicHint' } },
          examples: { type: 'array', items: { type: 'object', additionalProperties: true } },
          minimalExample: {},
          commonPatterns: { type: 'array', items: { $ref: '#/components/schemas/FlowSchemaPattern' } },
          antiPatterns: { type: 'array', items: { $ref: '#/components/schemas/FlowSchemaPattern' } },
          skeleton: {},
          hash: { type: 'string' },
          source: { type: 'string', enum: ['official', 'plugin', 'third-party'] },
        },
        additionalProperties: false,
      },
      FlowModelSchemaBundleItem: {
        type: 'object',
        required: [
          'use',
          'hash',
          'source',
          'coverage',
          'dynamicHints',
          'commonPatterns',
          'antiPatterns',
          'skeleton',
          'keyEnums',
        ],
        properties: {
          use: { type: 'string' },
          title: { type: 'string' },
          hash: { type: 'string' },
          source: { type: 'string', enum: ['official', 'plugin', 'third-party'] },
          coverage: { $ref: '#/components/schemas/FlowSchemaCoverage' },
          dynamicHints: { type: 'array', items: { $ref: '#/components/schemas/FlowDynamicHint' } },
          minimalExample: {},
          skeleton: {},
          commonPatterns: { type: 'array', items: { $ref: '#/components/schemas/FlowSchemaPattern' } },
          antiPatterns: { type: 'array', items: { $ref: '#/components/schemas/FlowSchemaPattern' } },
          keyEnums: {
            type: 'object',
            additionalProperties: { type: 'array', items: {} },
          },
        },
        additionalProperties: false,
      },
      FlowModelSchemaBundleDocument: {
        type: 'object',
        required: ['generatedAt', 'summary', 'items'],
        properties: {
          generatedAt: { type: 'string' },
          summary: { $ref: '#/components/schemas/FlowSchemaRegistrySummary' },
          items: { type: 'array', items: { $ref: '#/components/schemas/FlowModelSchemaBundleItem' } },
        },
        additionalProperties: false,
      },
      FlowModelsMutateOp: {
        type: 'object',
        required: ['opId', 'type', 'params'],
        properties: {
          opId: { type: 'string' },
          type: {
            type: 'string',
            enum: ['upsert', 'destroy', 'attach', 'move', 'ensure', 'duplicate'],
          },
          params: { type: 'object', additionalProperties: true },
        },
        additionalProperties: false,
      },
      FlowModelsMutateRequest: {
        type: 'object',
        required: ['atomic', 'ops'],
        properties: {
          atomic: { type: 'boolean', enum: [true] },
          ops: { type: 'array', items: { $ref: '#/components/schemas/FlowModelsMutateOp' } },
          returnModels: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
      FlowModelsMutateOpResult: {
        type: 'object',
        required: ['opId', 'ok'],
        properties: {
          opId: { type: 'string' },
          ok: { type: 'boolean' },
          output: { type: 'object', additionalProperties: true },
        },
        additionalProperties: true,
      },
      FlowModelsMutateResponse: {
        type: 'object',
        required: ['results'],
        properties: {
          results: { type: 'array', items: { $ref: '#/components/schemas/FlowModelsMutateOpResult' } },
          models: {
            type: 'object',
            additionalProperties: { $ref: '#/components/schemas/FlowModelSnapshot' },
          },
        },
        additionalProperties: true,
      },
      FlowModelSnapshot: {
        type: 'object',
        required: ['uid'],
        properties: {
          uid: { type: 'string', description: 'Model uid (primary key).' },
          use: { type: 'string', description: 'Model class name.' },
          async: { type: 'boolean', description: 'Whether this node is async.' },
          parentId: { type: 'string', description: 'Parent uid (when attached as a sub-model).' },
          subKey: { type: 'string', description: 'Sub-model key on parent.' },
          subType: { type: 'string', enum: ['object', 'array'], description: 'Sub-model type on parent.' },
          stepParams: { type: 'object', additionalProperties: true },
          flowRegistry: { type: 'object', additionalProperties: true },
          subModels: {
            type: 'object',
            additionalProperties: {
              oneOf: [
                { $ref: '#/components/schemas/FlowModelSnapshot' },
                { type: 'array', items: { $ref: '#/components/schemas/FlowModelSnapshot' } },
              ],
            },
          },
        },
        additionalProperties: true,
      },
    },
  },
};
