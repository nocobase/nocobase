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
    title: 'NocoBase API - ACL plugin',
    version: '1.0.0',
  },
  paths: {
    '/roles:list': {
      get: {
        tags: ['roles'],
        summary: 'List roles',
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Role',
                  },
                },
              },
            },
          },
        },
      },
    },
    '/roles:get': {
      get: {
        tags: ['roles'],
        summary: 'Get a role',
        parameters: [{ $ref: '#/components/parameters/RoleNameQuery' }],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Role',
                },
              },
            },
          },
        },
      },
    },
    '/roles:create': {
      post: {
        tags: ['roles'],
        summary: 'Create a role',
        description: 'Create a role. Request body uses direct role values.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/RoleWrite',
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
                  $ref: '#/components/schemas/Role',
                },
              },
            },
          },
        },
      },
    },
    '/roles:update': {
      post: {
        tags: ['roles'],
        summary: 'Update a role',
        description:
          'Update a role by role name (`filterByTk`). Commonly used for role metadata and system permission snippets.',
        parameters: [{ $ref: '#/components/parameters/RoleNameQuery' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/RoleWrite',
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
                  $ref: '#/components/schemas/Role',
                },
              },
            },
          },
        },
      },
    },
    '/roles:destroy': {
      post: {
        tags: ['roles'],
        summary: 'Destroy a role',
        parameters: [{ $ref: '#/components/parameters/RoleNameQuery' }],
        responses: {
          200: {
            description: 'OK',
          },
        },
      },
    },
    '/roles:check': {
      get: {
        tags: ['roles'],
        summary: 'Check current role context',
        description:
          'Return the current effective role context, including role mode and resolved ACL action map for the current user.',
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/RoleCheck',
                },
              },
            },
          },
        },
      },
    },
    '/roles:setDefaultRole': {
      post: {
        tags: ['roles'],
        summary: 'Set default role for new users',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  roleName: { type: 'string' },
                },
                required: ['roleName'],
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
    '/roles:setSystemRoleMode': {
      post: {
        tags: ['roles'],
        summary: 'Set system role mode',
        description: 'Set the system role mode. Valid values are `default`, `allow-use-union`, and `only-use-union`.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/RoleModeWrite',
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
    '/dataSources/{dataSourceKey}/roles:update': {
      post: {
        tags: ['dataSources.roles'],
        summary: 'Update global ACL strategy for a role in a data source',
        description:
          'Configure global table permissions for a role inside a data source. Request body typically includes `roleName`, `dataSourceKey`, and `strategy.actions`.',
        parameters: [
          { $ref: '#/components/parameters/DataSourceKeyPath' },
          { $ref: '#/components/parameters/RoleNameQuery' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/DataSourceRole',
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
                  $ref: '#/components/schemas/DataSourceRole',
                },
              },
            },
          },
        },
      },
    },
    '/dataSources/{dataSourceKey}/roles:get': {
      get: {
        tags: ['dataSources.roles'],
        summary: 'Get global ACL strategy for a role in a data source',
        parameters: [
          { $ref: '#/components/parameters/DataSourceKeyPath' },
          { $ref: '#/components/parameters/RoleNameQuery' },
        ],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/DataSourceRole',
                },
              },
            },
          },
        },
      },
    },
    '/roles/{roleName}/dataSourcesCollections:list': {
      get: {
        tags: ['roles.dataSourcesCollections'],
        summary: 'List data-source collections in role permission configuration',
        description:
          'List collections in the target data source for the given role and indicate whether they use global permissions or collection-level independent permissions.',
        parameters: [
          { $ref: '#/components/parameters/RoleNamePath' },
          { $ref: '#/components/parameters/PageQuery' },
          { $ref: '#/components/parameters/PageSizeQuery' },
          { $ref: '#/components/parameters/SortQuery' },
          { $ref: '#/components/parameters/AppendsQuery' },
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
                    count: { type: 'integer' },
                    rows: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/RoleCollectionPermissionRow' },
                    },
                    page: { type: 'integer' },
                    pageSize: { type: 'integer' },
                    totalPage: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/roles/{roleName}/dataSourceResources:create': {
      post: {
        tags: ['roles.dataSourceResources'],
        summary: 'Create collection-level independent ACL permissions for a role',
        description: [
          'Create collection-level independent permission config for a role in a data source.',
          'Request body usually includes `name`, `dataSourceKey`, `usingActionsConfig`, and `actions`.',
          'The server uses the role path parameter plus request-body `name` and `dataSourceKey` to create the record.',
        ].join('\n'),
        parameters: [{ $ref: '#/components/parameters/RoleNamePath' }, { $ref: '#/components/parameters/FilterQuery' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/RoleDataSourceResourceWrite',
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
                  $ref: '#/components/schemas/RoleDataSourceResource',
                },
              },
            },
          },
        },
      },
    },
    '/roles/{roleName}/dataSourceResources:get': {
      get: {
        tags: ['roles.dataSourceResources'],
        summary: 'Get one collection-level independent ACL permission for a role',
        description:
          'Get one collection-level independent permission config. Target it with a `filter` such as `{ name, dataSourceKey }`. Do not rely on `filterByTk` for this endpoint.',
        parameters: [
          { $ref: '#/components/parameters/RoleNamePath' },
          { $ref: '#/components/parameters/FilterQuery' },
          { $ref: '#/components/parameters/AppendsQuery' },
        ],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/RoleDataSourceResource',
                },
              },
            },
          },
        },
      },
    },
    '/roles/{roleName}/dataSourceResources:update': {
      post: {
        tags: ['roles.dataSourceResources'],
        summary: 'Update collection-level independent ACL permissions for a role',
        description:
          'Update one collection-level independent permission config. Target it with a `filter` such as `{ name, dataSourceKey }`. Do not rely on `filterByTk` for this endpoint.',
        parameters: [{ $ref: '#/components/parameters/RoleNamePath' }, { $ref: '#/components/parameters/FilterQuery' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/RoleDataSourceResourceWrite',
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
                  $ref: '#/components/schemas/RoleDataSourceResource',
                },
              },
            },
          },
        },
      },
    },
    '/rolesResourcesScopes:list': {
      get: {
        tags: ['rolesResourcesScopes'],
        summary: 'List reusable ACL scopes',
        parameters: [
          { $ref: '#/components/parameters/PageQuery' },
          { $ref: '#/components/parameters/PageSizeQuery' },
          { $ref: '#/components/parameters/FilterQuery' },
        ],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/RoleResourceScope' },
                },
              },
            },
          },
        },
      },
    },
    '/rolesResourcesScopes:get': {
      get: {
        tags: ['rolesResourcesScopes'],
        summary: 'Get a reusable ACL scope',
        parameters: [{ $ref: '#/components/parameters/ScopePkQuery' }, { $ref: '#/components/parameters/FilterQuery' }],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/RoleResourceScope',
                },
              },
            },
          },
        },
      },
    },
    '/dataSources/{dataSourceKey}/rolesResourcesScopes:list': {
      get: {
        tags: ['dataSources.rolesResourcesScopes'],
        summary: 'List reusable ACL scopes in a data source',
        parameters: [
          { $ref: '#/components/parameters/DataSourceKeyPath' },
          { $ref: '#/components/parameters/PageQuery' },
          { $ref: '#/components/parameters/PageSizeQuery' },
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
                      items: { $ref: '#/components/schemas/RoleResourceScope' },
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
    '/dataSources/{dataSourceKey}/rolesResourcesScopes:get': {
      get: {
        tags: ['dataSources.rolesResourcesScopes'],
        summary: 'Get a reusable ACL scope in a data source',
        parameters: [
          { $ref: '#/components/parameters/DataSourceKeyPath' },
          { $ref: '#/components/parameters/ScopePkQuery' },
          { $ref: '#/components/parameters/FilterQuery' },
        ],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/RoleResourceScope',
                },
              },
            },
          },
        },
      },
    },
    '/dataSources/{dataSourceKey}/rolesResourcesScopes:create': {
      post: {
        tags: ['dataSources.rolesResourcesScopes'],
        summary: 'Create a reusable ACL scope in a data source',
        description: 'Create a reusable scope definition under the target data source.',
        parameters: [{ $ref: '#/components/parameters/DataSourceKeyPath' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/RoleResourceScopeWrite',
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
                  $ref: '#/components/schemas/RoleResourceScope',
                },
              },
            },
          },
        },
      },
    },
    '/dataSources/{dataSourceKey}/rolesResourcesScopes:update': {
      post: {
        tags: ['dataSources.rolesResourcesScopes'],
        summary: 'Update a reusable ACL scope in a data source',
        parameters: [
          { $ref: '#/components/parameters/DataSourceKeyPath' },
          { $ref: '#/components/parameters/ScopePkQuery' },
          { $ref: '#/components/parameters/FilterQuery' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/RoleResourceScopeWrite',
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
                  $ref: '#/components/schemas/RoleResourceScope',
                },
              },
            },
          },
        },
      },
    },
    '/dataSources/{dataSourceKey}/rolesResourcesScopes:destroy': {
      post: {
        tags: ['dataSources.rolesResourcesScopes'],
        summary: 'Destroy a reusable ACL scope in a data source',
        parameters: [
          { $ref: '#/components/parameters/DataSourceKeyPath' },
          { $ref: '#/components/parameters/ScopePkQuery' },
          { $ref: '#/components/parameters/FilterQuery' },
        ],
        responses: {
          200: {
            description: 'OK',
          },
        },
      },
    },
    '/availableActions:list': {
      get: {
        tags: ['availableActions'],
        summary: 'List configurable ACL actions',
        description:
          'List ACL actions available in the current system. Use this before configuring resource-level action or field permissions.',
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/AvailableAction' },
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
      RoleNameQuery: {
        name: 'filterByTk',
        in: 'query',
        description: 'Role name.',
        required: true,
        schema: { type: 'string' },
      },
      RoleNamePath: {
        name: 'roleName',
        in: 'path',
        description: 'Role name.',
        required: true,
        schema: { type: 'string' },
      },
      DataSourceKeyPath: {
        name: 'dataSourceKey',
        in: 'path',
        description: 'Data source key, for example `main`.',
        required: true,
        schema: { type: 'string' },
      },
      ResourceNameQuery: {
        name: 'filterByTk',
        in: 'query',
        description: 'Resource name, typically the collection name.',
        required: true,
        schema: { type: 'string' },
      },
      ScopePkQuery: {
        name: 'filterByTk',
        in: 'query',
        description: 'Scope primary key.',
        schema: { type: 'integer' },
      },
      ResourcePermissionTkQuery: {
        name: 'filterByTk',
        in: 'query',
        description: 'Resource permission record primary key.',
        schema: { type: 'integer' },
      },
      PageQuery: {
        name: 'page',
        in: 'query',
        schema: { type: 'integer' },
      },
      PageSizeQuery: {
        name: 'pageSize',
        in: 'query',
        schema: { type: 'integer' },
      },
      FilterQuery: {
        name: 'filter',
        in: 'query',
        schema: {
          type: 'object',
          additionalProperties: true,
        },
      },
      AppendsQuery: {
        name: 'appends',
        in: 'query',
        schema: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
    schemas: {
      RoleStrategy: {
        type: 'object',
        description: 'Global action strategy for a role.',
        properties: {
          actions: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Action names such as `create`, `view`, `update`, `destroy`, or scoped variants like `view:own`.',
          },
        },
        additionalProperties: true,
      },
      RoleWrite: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Role title.' },
          name: { type: 'string', description: 'Role identifier.' },
          description: { type: 'string', description: 'Role description.' },
          hidden: { type: 'boolean', description: 'Whether the role is hidden.' },
          default: { type: 'boolean', description: 'Whether the role is default for new users.' },
          allowConfigure: { type: 'boolean', description: 'Whether the role can be configured.' },
          allowNewMenu: { type: 'boolean', description: 'Whether the role can create menus.' },
          snippets: {
            type: 'array',
            items: { type: 'string' },
            description: 'System permission snippets, for example `ui.*`, `!pm`, or `!app`.',
          },
          strategy: {
            allOf: [{ $ref: '#/components/schemas/RoleStrategy' }],
            description: 'Role-level ACL strategy.',
          },
        },
        additionalProperties: true,
      },
      Role: {
        allOf: [{ $ref: '#/components/schemas/RoleWrite' }],
        properties: {
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      RoleCheck: {
        type: 'object',
        properties: {
          role: { type: 'string', description: 'Current effective role name.' },
          roleMode: {
            type: 'string',
            enum: ['default', 'allow-use-union', 'only-use-union'],
            description: 'System role mode.',
          },
          availableActions: {
            type: 'array',
            items: { type: 'string' },
          },
          actions: {
            type: 'object',
            additionalProperties: true,
            description: 'Resolved ACL action map for the current role context.',
          },
        },
        additionalProperties: true,
      },
      RoleModeWrite: {
        type: 'object',
        properties: {
          roleMode: {
            type: 'string',
            enum: ['default', 'allow-use-union', 'only-use-union'],
          },
        },
        required: ['roleMode'],
      },
      DataSourceRole: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Optional existing role-data-source permission record id.' },
          roleName: { type: 'string', description: 'Role name.' },
          dataSourceKey: { type: 'string', description: 'Data source key, usually `main`.' },
          strategy: {
            allOf: [{ $ref: '#/components/schemas/RoleStrategy' }],
            description: 'Global table actions for this role in the data source.',
          },
        },
        additionalProperties: true,
      },
      RoleCollectionPermissionRow: {
        type: 'object',
        properties: {
          type: { type: 'string', description: 'Resource type, usually `collection`.' },
          name: { type: 'string', description: 'Collection name.' },
          collectionName: { type: 'string', description: 'Collection name.' },
          title: { type: 'string', description: 'Collection title.' },
          roleName: { type: 'string', description: 'Role name.' },
          usingConfig: {
            type: 'string',
            enum: ['resourceAction', 'strategy'],
            description:
              '`strategy` means the collection uses global permissions. `resourceAction` means it has collection-level independent permissions.',
          },
          exists: { type: 'boolean', description: 'Whether a dedicated resource config exists.' },
        },
      },
      RoleResourceScope: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: 'Scope primary key.' },
          key: { type: 'string', description: 'Scope key such as `all` or `own`.' },
          dataSourceKey: {
            type: 'string',
            nullable: true,
            description: 'Optional data source key, for example `main`.',
          },
          name: { type: 'string', description: 'Scope display name.' },
          resourceName: { type: 'string', nullable: true, description: 'Optional resource binding.' },
          scope: {
            type: 'object',
            additionalProperties: true,
            description: 'JSON filter object used as the ACL scope condition.',
          },
        },
        additionalProperties: true,
      },
      RoleResourceScopeWrite: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: 'Optional scope primary key, commonly present in update payloads.' },
          dataSourceKey: { type: 'string', nullable: true, description: 'Optional data source key.' },
          resourceName: { type: 'string', nullable: true, description: 'Optional bound resource name.' },
          name: { type: 'string', description: 'Scope display name.' },
          scope: {
            type: 'object',
            additionalProperties: true,
            description: 'Row filter JSON.',
          },
        },
        required: ['name', 'scope'],
        additionalProperties: true,
      },
      RoleResourceAction: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'Optional action record id, commonly present in update payloads.',
          },
          name: {
            type: 'string',
            description: 'ACL action name, for example `view`, `create`, `update`, `destroy`, or a scoped variant.',
          },
          fields: {
            type: 'array',
            items: { type: 'string' },
            description: 'Allowed field names for this action when field-level configuration is supported.',
          },
          scopeId: {
            type: 'integer',
            nullable: true,
            description: 'Optional bound scope id. Use `null` to clear the scope.',
          },
          scope: {
            allOf: [{ $ref: '#/components/schemas/RoleResourceScope' }],
            nullable: true,
            description: 'Optional row-permission scope for this action.',
          },
        },
        required: ['name'],
        additionalProperties: true,
      },
      RoleDataSourceResourceWrite: {
        type: 'object',
        description: 'Collection-level independent permission config inside a data source.',
        properties: {
          id: {
            type: 'integer',
            description: 'Optional resource permission record id, commonly present in update payloads.',
          },
          name: { type: 'string', description: 'Resource name, typically the collection name.' },
          dataSourceKey: { type: 'string', description: 'Data source key, usually `main`.' },
          roleName: { type: 'string', description: 'Optional role name echoed by the client in update payloads.' },
          usingActionsConfig: {
            type: 'boolean',
            description: 'Whether this collection uses independent actions instead of only the global strategy.',
          },
          actions: {
            type: 'array',
            items: { $ref: '#/components/schemas/RoleResourceAction' },
            description: 'Independent action configs for this collection.',
          },
        },
        required: ['name', 'dataSourceKey'],
        additionalProperties: true,
      },
      RoleDataSourceResource: {
        allOf: [{ $ref: '#/components/schemas/RoleDataSourceResourceWrite' }],
        properties: {
          id: { type: 'integer' },
          roleName: { type: 'string' },
        },
      },
      AvailableAction: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Action name.' },
          displayName: { type: 'string', description: 'Localized display name.' },
          allowConfigureFields: {
            type: 'boolean',
            description: 'Whether field-level permission config is supported for this action.',
          },
          onNewRecord: {
            type: 'boolean',
            description: 'Whether the action applies to new records instead of existing records.',
          },
          type: {
            type: 'string',
            description: 'Action category such as `new-data` or `old-data`.',
          },
          aliases: {
            type: 'array',
            items: { type: 'string' },
            description: 'Action aliases resolved by ACL.',
          },
        },
        additionalProperties: true,
      },
    },
  },
};
