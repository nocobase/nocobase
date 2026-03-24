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
    title: 'NocoBase API - Client plugin',
    version: '1.0.0',
  },
  paths: {
    '/roles/{roleName}/desktopRoutes:add': {
      post: {
        tags: ['roles.desktopRoutes'],
        summary: 'Add desktop route permissions to a role',
        parameters: [{ $ref: '#/components/parameters/RoleNamePath' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RouteIdList' },
            },
          },
        },
        responses: {
          200: { description: 'OK' },
        },
      },
    },
    '/roles/{roleName}/desktopRoutes:remove': {
      post: {
        tags: ['roles.desktopRoutes'],
        summary: 'Remove desktop route permissions from a role',
        parameters: [{ $ref: '#/components/parameters/RoleNamePath' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RouteIdList' },
            },
          },
        },
        responses: {
          200: { description: 'OK' },
        },
      },
    },
    '/roles/{roleName}/desktopRoutes:set': {
      post: {
        tags: ['roles.desktopRoutes'],
        summary: 'Set desktop route permissions for a role',
        parameters: [{ $ref: '#/components/parameters/RoleNamePath' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RouteIdList' },
            },
          },
        },
        responses: {
          200: { description: 'OK' },
        },
      },
    },
    '/roles/{roleName}/desktopRoutes:list': {
      get: {
        tags: ['roles.desktopRoutes'],
        summary: 'List desktop routes granted to a role',
        parameters: [
          { $ref: '#/components/parameters/RoleNamePath' },
          { $ref: '#/components/parameters/PaginateQuery' },
          { $ref: '#/components/parameters/FilterQuery' },
        ],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/DesktopRoute' },
                    },
                    meta: {
                      type: 'object',
                      additionalProperties: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/desktopRoutes:listAccessible': {
      get: {
        tags: ['desktopRoutes'],
        summary: 'List desktop routes accessible to the current user',
        description:
          'List desktop routes that the current user can access. Creating or destroying routes may also create or remove flowModels anchors through desktopRoutes hooks.',
        parameters: [
          { $ref: '#/components/parameters/TreeQuery' },
          { $ref: '#/components/parameters/SortScalarQuery' },
          { $ref: '#/components/parameters/FilterQuery' },
        ],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DataWrappedDesktopRouteListResponse' },
              },
            },
          },
        },
      },
    },
    '/desktopRoutes:getAccessible': {
      get: {
        tags: ['desktopRoutes'],
        summary: 'Get one accessible desktop route',
        description: 'Get one accessible desktop route by filter.',
        parameters: [
          { $ref: '#/components/parameters/FilterQuery' },
          { $ref: '#/components/parameters/FilterByTkQuery' },
        ],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DataWrappedNullableDesktopRouteResponse' },
              },
            },
          },
        },
      },
    },
    '/desktopRoutes:create': {
      post: {
        tags: ['desktopRoutes'],
        summary: 'Create a desktop route',
        description:
          'Create a desktop route. Side effect: the desktopRoutes.afterCreate hook may create a flowModels anchor using schemaUid for the created route.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DesktopRouteCreateValues' },
            },
          },
        },
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DataWrappedDesktopRouteResponse' },
              },
            },
          },
        },
      },
    },
    '/desktopRoutes:update': {
      post: {
        tags: ['desktopRoutes'],
        summary: 'Update a desktop route',
        description: 'Update a desktop route by filterByTk or filter.',
        parameters: [
          { $ref: '#/components/parameters/FilterByTkQuery' },
          { $ref: '#/components/parameters/FilterQuery' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DesktopRouteUpdateValues' },
            },
          },
        },
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DataWrappedDesktopRouteResponse' },
              },
            },
          },
        },
      },
    },
    '/desktopRoutes:updateOrCreate': {
      post: {
        tags: ['desktopRoutes'],
        summary: 'Update or create a desktop route',
        description: 'Update or create a desktop route by filterKeys.',
        parameters: [{ $ref: '#/components/parameters/FilterKeysQuery' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DesktopRouteCreateValues' },
            },
          },
        },
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DataWrappedDesktopRouteOrListResponse' },
              },
            },
          },
        },
      },
    },
    '/desktopRoutes:move': {
      post: {
        tags: ['desktopRoutes'],
        summary: 'Move a desktop route',
        description: 'Move a route in the menu tree.',
        parameters: [
          { $ref: '#/components/parameters/SourceIdQuery' },
          { $ref: '#/components/parameters/TargetIdQuery' },
          { $ref: '#/components/parameters/MethodQuery' },
          { $ref: '#/components/parameters/SortFieldQuery' },
          { $ref: '#/components/parameters/TargetScopeQuery' },
          { $ref: '#/components/parameters/StickyQuery' },
        ],
        responses: {
          200: { description: 'OK' },
        },
      },
    },
    '/desktopRoutes:destroy': {
      post: {
        tags: ['desktopRoutes'],
        summary: 'Destroy a desktop route',
        description:
          'Destroy a desktop route. Side effect: the desktopRoutes.afterDestroy hook may remove flowModels anchors related to the destroyed route.',
        parameters: [
          { $ref: '#/components/parameters/FilterByTkQuery' },
          { $ref: '#/components/parameters/FilterQuery' },
        ],
        responses: {
          200: { description: 'OK' },
        },
      },
    },
    '/desktopRoutes:createV2': {
      post: {
        tags: ['desktopRoutes'],
        summary: 'Create a Modern page (v2)',
        description:
          'Create a Modern page (v2) in one transaction: creates the page route and default hidden tab route, inserts the FlowRoute uiSchema shell, and precreates key flowModels subtrees. The operation is idempotent on schemaUid.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DesktopRouteCreateV2Request' },
              examples: {
                createV2: {
                  summary: 'Create v2 page',
                  value: {
                    schemaUid: 'page-uid-001',
                    parentId: null,
                    title: 'My Page',
                    icon: 'Icon',
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
                schema: { $ref: '#/components/schemas/DataWrappedDesktopRouteCreateV2Response' },
              },
            },
          },
          400: {
            description: 'Bad Request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          409: {
            description: 'Conflict',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/desktopRoutes:destroyV2': {
      post: {
        tags: ['desktopRoutes'],
        summary: 'Destroy a Modern page (v2)',
        description:
          'Destroy a Modern page (v2) by schemaUid in one transaction: removes the page route and its children, removes the FlowRoute uiSchema shell, and relies on desktopRoutes.afterDestroy to clean up flowModels anchors.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DesktopRouteDestroyV2Request' },
              examples: {
                destroyV2: {
                  summary: 'Destroy v2 page',
                  value: { schemaUid: 'page-uid-001' },
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
                schema: { $ref: '#/components/schemas/DataWrappedOkResponse' },
              },
            },
          },
          400: {
            description: 'Bad Request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
  },
  components: {
    parameters: {
      RoleNamePath: {
        name: 'roleName',
        in: 'path',
        description: 'Role name.',
        required: true,
        schema: { type: 'string' },
      },
      PaginateQuery: {
        name: 'paginate',
        in: 'query',
        description: 'Whether to return paginated result format.',
        required: false,
        schema: { type: 'boolean' },
      },
      TreeQuery: {
        name: 'tree',
        in: 'query',
        description: 'Whether to return routes as a tree.',
        required: false,
        schema: { type: 'boolean' },
      },
      SortScalarQuery: {
        name: 'sort',
        in: 'query',
        description: 'Sort field, for example `sort`.',
        required: false,
        schema: { type: 'string' },
      },
      FilterQuery: {
        name: 'filter',
        in: 'query',
        description: 'JSON filter object.',
        required: false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: true,
            },
          },
        },
      },
      FilterByTkQuery: {
        name: 'filterByTk',
        in: 'query',
        description: 'Filter by target key, usually route id.',
        required: false,
        schema: { type: 'string' },
      },
      FilterKeysQuery: {
        name: 'filterKeys',
        in: 'query',
        description: 'Field list used to find an existing route before updateOrCreate.',
        required: true,
        schema: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      SourceIdQuery: {
        name: 'sourceId',
        in: 'query',
        description: 'Source route id.',
        required: true,
        schema: { type: 'string' },
      },
      TargetIdQuery: {
        name: 'targetId',
        in: 'query',
        description: 'Target route id.',
        required: false,
        schema: { type: 'string' },
      },
      MethodQuery: {
        name: 'method',
        in: 'query',
        description: 'Move method, for example `insertAfter` or `prepend`.',
        required: false,
        schema: { type: 'string' },
      },
      SortFieldQuery: {
        name: 'sortField',
        in: 'query',
        description: 'Sort field name, default is `sort`.',
        required: false,
        schema: { type: 'string' },
      },
      TargetScopeQuery: {
        name: 'targetScope',
        in: 'query',
        description: 'JSON scope object used to constrain move target.',
        required: false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: true,
            },
          },
        },
      },
      StickyQuery: {
        name: 'sticky',
        in: 'query',
        description: 'Whether to move the route to the sticky position.',
        required: false,
        schema: { type: 'boolean' },
      },
    },
    schemas: {
      RouteIdList: {
        type: 'array',
        description: 'Desktop route id list.',
        items: { type: 'integer' },
      },
      ErrorItem: {
        type: 'object',
        required: ['message'],
        properties: {
          code: { type: 'string' },
          message: { type: 'string' },
          details: {
            type: 'object',
            additionalProperties: true,
          },
          opId: { type: 'string' },
          opIndex: { type: 'number' },
        },
        additionalProperties: true,
      },
      ErrorResponse: {
        type: 'object',
        required: ['errors'],
        properties: {
          errors: {
            type: 'array',
            items: { $ref: '#/components/schemas/ErrorItem' },
          },
        },
        additionalProperties: true,
      },
      DataWrappedDesktopRouteListResponse: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/DesktopRoute' },
          },
        },
        additionalProperties: true,
      },
      DataWrappedNullableDesktopRouteResponse: {
        type: 'object',
        properties: {
          data: {
            anyOf: [{ $ref: '#/components/schemas/DesktopRoute' }, { type: 'null' }],
          },
        },
        additionalProperties: true,
      },
      DataWrappedDesktopRouteResponse: {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/DesktopRoute' },
        },
        additionalProperties: true,
      },
      DataWrappedDesktopRouteOrListResponse: {
        type: 'object',
        properties: {
          data: {
            anyOf: [
              { $ref: '#/components/schemas/DesktopRoute' },
              {
                type: 'array',
                items: { $ref: '#/components/schemas/DesktopRoute' },
              },
            ],
          },
        },
        additionalProperties: true,
      },
      DataWrappedDesktopRouteCreateV2Response: {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/DesktopRouteCreateV2Response' },
        },
        additionalProperties: true,
      },
      DataWrappedOkResponse: {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/OkResponse' },
        },
        additionalProperties: true,
      },
      DesktopRoute: {
        type: 'object',
        properties: {
          id: {
            oneOf: [{ type: 'integer' }, { type: 'string' }],
          },
          title: { type: 'string' },
          tooltip: { type: 'string', nullable: true },
          type: { type: 'string' },
          icon: { type: 'string', nullable: true },
          path: { type: 'string', nullable: true },
          parentId: {
            anyOf: [{ type: 'integer' }, { type: 'string' }, { type: 'null' }],
          },
          schemaUid: { type: 'string', nullable: true },
          menuSchemaUid: { type: 'string', nullable: true },
          tabSchemaName: { type: 'string', nullable: true },
          hideInMenu: { type: 'boolean', nullable: true },
          enableTabs: { type: 'boolean', nullable: true },
          enableHeader: { type: 'boolean', nullable: true },
          displayTitle: { type: 'boolean', nullable: true },
          hidden: { type: 'boolean', nullable: true },
          sort: { type: 'integer', nullable: true },
          options: {
            type: 'object',
            additionalProperties: true,
            nullable: true,
          },
          children: {
            type: 'array',
            items: { $ref: '#/components/schemas/DesktopRoute' },
          },
        },
        additionalProperties: true,
      },
      DesktopRouteCreateValues: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          title: { type: 'string' },
          tooltip: { type: 'string' },
          icon: { type: 'string' },
          parentId: {
            anyOf: [{ type: 'integer' }, { type: 'string' }, { type: 'null' }],
          },
          schemaUid: { type: 'string' },
          menuSchemaUid: { type: 'string' },
          tabSchemaName: { type: 'string' },
          hideInMenu: { type: 'boolean' },
          enableTabs: { type: 'boolean' },
          enableHeader: { type: 'boolean' },
          displayTitle: { type: 'boolean' },
          hidden: { type: 'boolean' },
          sort: { type: 'integer' },
          options: {
            type: 'object',
            additionalProperties: true,
          },
          children: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: true,
            },
          },
        },
        additionalProperties: true,
      },
      DesktopRouteUpdateValues: {
        type: 'object',
        additionalProperties: true,
      },
      DesktopRouteCreateV2Request: {
        type: 'object',
        required: ['schemaUid', 'title'],
        properties: {
          schemaUid: { type: 'string' },
          parentId: {
            anyOf: [{ type: 'integer' }, { type: 'string' }, { type: 'null' }],
          },
          title: { type: 'string' },
          icon: { type: 'string' },
        },
        additionalProperties: false,
      },
      DesktopRouteCreateV2Response: {
        type: 'object',
        required: ['page', 'defaultTab'],
        properties: {
          page: {
            type: 'object',
            properties: {
              id: {
                oneOf: [{ type: 'integer' }, { type: 'string' }],
              },
              schemaUid: { type: 'string' },
              title: { type: 'string' },
              icon: { type: 'string', nullable: true },
              parentId: {
                anyOf: [{ type: 'integer' }, { type: 'string' }, { type: 'null' }],
              },
              menuSchemaUid: { type: 'string', nullable: true },
            },
            additionalProperties: true,
          },
          defaultTab: {
            type: 'object',
            nullable: true,
            properties: {
              id: {
                oneOf: [{ type: 'integer' }, { type: 'string' }],
              },
              schemaUid: { type: 'string' },
              tabSchemaName: { type: 'string', nullable: true },
            },
            additionalProperties: true,
          },
        },
        additionalProperties: true,
      },
      DesktopRouteDestroyV2Request: {
        type: 'object',
        required: ['schemaUid'],
        properties: {
          schemaUid: { type: 'string' },
        },
        additionalProperties: false,
      },
      OkResponse: {
        type: 'object',
        required: ['ok'],
        properties: {
          ok: { type: 'boolean' },
        },
        additionalProperties: true,
      },
    },
  },
};
