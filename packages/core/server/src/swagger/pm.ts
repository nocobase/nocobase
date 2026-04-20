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

/** `filterByTk` for enable/disable: comma-separated package names are supported. */
const pluginPmEnableDisableFilterParameter = {
  name: 'filterByTk',
  in: 'query',
  required: true,
  description:
    'Plugin package name(s). Pass multiple plugins as a comma-separated list (e.g. `@nocobase/plugin-a,@nocobase/plugin-b`).',
  schema: {
    type: 'string',
  },
};

/** Whether to wait for the `pm enable` / `pm disable` CLI invocation to finish before responding. */
const pluginPmAwaitResponseParameter = {
  name: 'awaitResponse',
  in: 'query',
  required: false,
  description:
    'When `true`, await the CLI operation and return its result in the response body. When `false` or omitted, start the operation and return promptly (body is usually the plugin name or the `filterByTk` value for enable).',
  schema: {
    type: 'boolean',
    default: false,
  },
};

/** Query flag for `GET /pm:list`: compact list from package discovery vs full locale-aware records. */
const pluginListModeParameter = {
  name: 'mode',
  in: 'query',
  required: false,
  description:
    'Use `summary` for a compact list (`displayName`, `packageName`, `enabled`, `description`). Omit for full plugin objects (`PMPlugin`), including locale-specific fields from the nocobase plugin.',
  schema: {
    type: 'string',
    enum: ['summary'],
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

const pluginListResponseOneOf = {
  description:
    'OK. Shape depends on `mode`: full `PMPlugin` list by default, or `PMPluginListSummaryItem` when `mode=summary`.',
  content: {
    'application/json': {
      schema: {
        oneOf: [
          {
            type: 'array',
            items: {
              $ref: '#/components/schemas/PMPlugin',
            },
          },
          {
            type: 'array',
            items: {
              $ref: '#/components/schemas/PMPluginListSummaryItem',
            },
          },
        ],
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
    PMPluginListSummaryItem: {
      type: 'object',
      description: 'Compact plugin row returned when listing with `mode=summary`.',
      properties: {
        displayName: {
          type: 'string',
        },
        packageName: {
          type: 'string',
        },
        enabled: {
          type: 'boolean',
        },
        description: {
          type: 'string',
        },
      },
      additionalProperties: true,
    },
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
      description:
        'Return plugin metadata from the plugin manager. Pass `mode=summary` for a lightweight list built from discovered packages; omit `mode` for full records (locale-aware via the nocobase plugin).',
      parameters: [pluginListModeParameter],
      responses: {
        200: pluginListResponseOneOf,
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
      description:
        'Run plugin enable via the plugin manager. Use `awaitResponse=true` to wait for completion. Multiple plugins can be passed in `filterByTk` as a comma-separated list.',
      parameters: [pluginPmEnableDisableFilterParameter, pluginPmAwaitResponseParameter],
      responses: {
        200: pluginOperationResponse,
      },
    },
  },
  '/pm:disable': {
    post: {
      tags: ['pm'],
      summary: 'Disable a plugin',
      description:
        'Run plugin disable via the plugin manager. Use `awaitResponse=true` to wait for completion. Multiple plugins can be passed in `filterByTk` as a comma-separated list.',
      parameters: [pluginPmEnableDisableFilterParameter, pluginPmAwaitResponseParameter],
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
