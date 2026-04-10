/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const pluginNameParameter = {
  name: 'filterByTk',
  in: 'query',
  description: 'Plugin name.',
  required: true,
  schema: {
    type: 'string',
  },
};

const pluginListResponse = {
  description: 'OK',
  content: {
    'application/json': {
      schema: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/PMPlugin',
        },
      },
    },
  },
};

const enabledPluginListResponse = {
  description: 'OK',
  content: {
    'application/json': {
      schema: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/PMEnabledPlugin',
        },
      },
    },
  },
};

const pluginOperationResponse = {
  description: 'OK',
  content: {
    'application/json': {
      schema: {
        oneOf: [
          {
            type: 'string',
            example: 'ok',
          },
          {
            $ref: '#/components/schemas/PMPluginActionResult',
          },
        ],
      },
    },
  },
};

export const pmComponents = {
  schemas: {
    PMPlugin: {
      type: 'object',
      properties: {
        id: {
          type: 'integer',
        },
        name: {
          type: 'string',
          description: 'Plugin short name.',
        },
        packageName: {
          type: 'string',
          description: 'Plugin package name.',
        },
        version: {
          type: 'string',
        },
        enabled: {
          type: 'boolean',
        },
        installed: {
          type: 'boolean',
        },
        builtIn: {
          type: 'boolean',
        },
        options: {
          type: 'object',
          additionalProperties: true,
        },
      },
      additionalProperties: true,
    },
    PMEnabledPlugin: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        packageName: {
          type: 'string',
        },
        options: {
          type: 'object',
          additionalProperties: true,
        },
        url: {
          type: 'string',
          description: 'Resolved client bundle URL.',
        },
      },
      additionalProperties: true,
    },
    PMPluginActionResult: {
      type: 'string',
      description: 'Queued successfully.',
      example: 'ok',
    },
    PMInstallOrUpdatePayload: {
      type: 'object',
      description: 'JSON payload for installing or updating a plugin from npm or a compressed package URL.',
      properties: {
        packageName: {
          type: 'string',
          description: 'Plugin package name.',
        },
        version: {
          type: 'string',
          description: 'Target plugin version.',
        },
        registry: {
          type: 'string',
          description: 'Custom npm registry URL.',
        },
        authToken: {
          type: 'string',
          description: 'Authentication token used when accessing a private registry.',
        },
        compressedFileUrl: {
          type: 'string',
          description: 'Remote compressed package URL.',
        },
      },
      additionalProperties: true,
    },
    PMUploadPayload: {
      type: 'object',
      description: 'Multipart payload for uploading a plugin package file.',
      properties: {
        packageName: {
          type: 'string',
          description: 'Plugin package name. Required when updating from an uploaded file.',
        },
        version: {
          type: 'string',
        },
        registry: {
          type: 'string',
        },
        authToken: {
          type: 'string',
        },
        file: {
          type: 'string',
          format: 'binary',
          description: 'Compressed plugin package file.',
        },
      },
      additionalProperties: true,
    },
  },
} as const;

export default {
  '/pm:list': {
    get: {
      tags: ['pm'],
      summary: 'List available plugins',
      description: 'Return plugin metadata from the plugin manager.',
      parameters: [],
      responses: {
        200: pluginListResponse,
      },
    },
  },
  '/pm:get': {
    get: {
      tags: ['pm'],
      summary: 'Get plugin details',
      description: 'Return metadata for a single plugin.',
      parameters: [pluginNameParameter],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PMPlugin',
              },
            },
          },
        },
      },
    },
  },
  '/pm:listEnabled': {
    get: {
      tags: ['pm'],
      summary: 'List enabled client plugins',
      description: 'Return enabled plugins that expose a `dist/client/index.js` entry.',
      parameters: [],
      responses: {
        200: enabledPluginListResponse,
      },
    },
  },
  '/pm:listEnabledV2': {
    get: {
      tags: ['pm'],
      summary: 'List enabled client-v2 plugins',
      description: 'Return enabled plugins that expose a `dist/client-v2/index.js` entry.',
      parameters: [],
      responses: {
        200: enabledPluginListResponse,
      },
    },
  },
  // '/pm:npmVersionList': {
  //   get: {
  //     tags: ['pm'],
  //     summary: 'List published plugin versions',
  //     description: 'Return all available npm versions for a specific installed plugin.',
  //     parameters: [pluginNameParameter],
  //     responses: {
  //       200: {
  //         description: 'OK',
  //         content: {
  //           'application/json': {
  //             schema: {
  //               type: 'array',
  //               items: {
  //                 type: 'string',
  //               },
  //             },
  //           },
  //         },
  //       },
  //     },
  //   },
  // },
  '/pm:add': {
    post: {
      tags: ['pm'],
      summary: 'Install a plugin',
      description:
        'Queue a plugin installation from npm, a remote compressed package URL, or an uploaded package file.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/PMInstallOrUpdatePayload',
            },
          },
          'multipart/form-data': {
            schema: {
              $ref: '#/components/schemas/PMUploadPayload',
            },
          },
        },
      },
      responses: {
        200: pluginOperationResponse,
      },
    },
  },
  '/pm:update': {
    post: {
      tags: ['pm'],
      summary: 'Update a plugin',
      description: 'Queue a plugin update from npm, a remote compressed package URL, or an uploaded package file.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/PMInstallOrUpdatePayload',
            },
          },
          'multipart/form-data': {
            schema: {
              $ref: '#/components/schemas/PMUploadPayload',
            },
          },
        },
      },
      responses: {
        200: pluginOperationResponse,
      },
    },
  },
  '/pm:enable': {
    post: {
      tags: ['pm'],
      summary: 'Enable a plugin',
      description: 'Queue an enable operation for a plugin.',
      parameters: [pluginNameParameter],
      responses: {
        200: pluginOperationResponse,
      },
    },
  },
  '/pm:disable': {
    post: {
      tags: ['pm'],
      summary: 'Disable a plugin',
      description: 'Queue a disable operation for a plugin.',
      parameters: [pluginNameParameter],
      responses: {
        200: pluginOperationResponse,
      },
    },
  },
  '/pm:remove': {
    post: {
      tags: ['pm'],
      summary: 'Remove a plugin',
      description: 'Queue a removal operation for a plugin.',
      parameters: [pluginNameParameter],
      responses: {
        200: pluginOperationResponse,
      },
    },
  },
} as const;
