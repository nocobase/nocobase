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
    title: 'NocoBase API - Multi-portal plugin',
    version: '1.0.0',
  },
  paths: {
    '/roles/{roleName}/multiPortals:list': {
      get: {
        tags: ['roles.multiPortals'],
        summary: 'List Portals granted to a role',
        description: 'List existing custom Portals that the role is explicitly allowed to enter.',
        parameters: [{ $ref: '#/components/parameters/RoleNamePath' }],
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
                      items: { $ref: '#/components/schemas/PortalAccessTarget' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/roles/{roleName}/multiPortals:add': {
      post: {
        tags: ['roles.multiPortals'],
        summary: 'Grant Portal entry access to a role',
        description: 'Allow the role to enter one or more existing custom Portals by uid.',
        parameters: [{ $ref: '#/components/parameters/RoleNamePath' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PortalAccessWrite' },
            },
          },
        },
        responses: {
          200: { description: 'OK' },
        },
      },
    },
    '/roles/{roleName}/multiPortals:remove': {
      post: {
        tags: ['roles.multiPortals'],
        summary: 'Revoke Portal entry access from a role',
        description: 'Prevent the role from entering one or more existing custom Portals by uid.',
        parameters: [{ $ref: '#/components/parameters/RoleNamePath' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PortalAccessWrite' },
            },
          },
        },
        responses: {
          200: { description: 'OK' },
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
    },
    schemas: {
      PortalAccessWrite: {
        type: 'object',
        properties: {
          values: {
            type: 'array',
            description: 'Portal uids.',
            items: { type: 'string' },
            minItems: 1,
            uniqueItems: true,
          },
        },
        required: ['values'],
      },
      PortalAccessTarget: {
        type: 'object',
        additionalProperties: true,
        properties: {
          uid: { type: 'string' },
          title: { type: 'string' },
          portalName: { type: 'string' },
          routePath: { type: 'string' },
          portalType: { type: 'string' },
          enabled: { type: 'boolean' },
        },
      },
    },
  },
};
