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
        schema: { type: 'object', additionalProperties: true },
      },
    },
    schemas: {
      RouteIdList: {
        type: 'array',
        description: 'Desktop route id list.',
        items: { type: 'integer' },
      },
      DesktopRoute: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          title: { type: 'string' },
          type: { type: 'string' },
          path: { type: 'string', nullable: true },
          parentId: { type: 'integer', nullable: true },
          hidden: { type: 'boolean', nullable: true },
          children: {
            type: 'array',
            items: { $ref: '#/components/schemas/DesktopRoute' },
          },
        },
        additionalProperties: true,
      },
    },
  },
};
