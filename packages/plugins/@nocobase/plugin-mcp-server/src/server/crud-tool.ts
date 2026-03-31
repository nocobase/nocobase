/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { McpTool, McpToolCallContext, McpToolsManager } from '@nocobase/ai';
import inject from 'light-my-request';

type CrudAction = 'list' | 'get' | 'create' | 'update' | 'destroy';

type BusinessTableCrudArgs = {
  dataSource?: string;
  resource: string;
  action: CrudAction;
  sourceId?: string | number;
  filterByTk?: string | number | Array<string | number>;
  values?: Record<string, any>;
  filter?: Record<string, any>;
  fields?: string[];
  appends?: string[];
  except?: string[];
  sort?: string[];
  page?: number;
  pageSize?: number;
  paginate?: boolean;
  whitelist?: string[];
  blacklist?: string[];
  updateAssociationValues?: string[];
  forceUpdate?: boolean;
};

function normalizeHeaderValue(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function buildActionUrl(resource: string, action: CrudAction, sourceId?: string | number) {
  if (typeof sourceId === 'undefined' || sourceId === null || !resource.includes('.')) {
    return `${resource}:${action}`;
  }

  const [parentResource, childResource] = resource.split('.');
  return `${parentResource}/${encodeURIComponent(String(sourceId))}/${childResource}:${action}`;
}

function buildQueryValue(value: any) {
  if (typeof value === 'undefined') {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return value;
}

function buildRequestQuery(args: BusinessTableCrudArgs) {
  const {
    filterByTk,
    filter,
    fields,
    appends,
    except,
    sort,
    page,
    pageSize,
    paginate,
    whitelist,
    blacklist,
    updateAssociationValues,
    forceUpdate,
  } = args;

  const query: Record<string, any> = {
    filterByTk: buildQueryValue(filterByTk),
    filter: buildQueryValue(filter),
    fields: buildQueryValue(fields),
    appends: buildQueryValue(appends),
    except: buildQueryValue(except),
    sort: buildQueryValue(sort),
    page: buildQueryValue(page),
    pageSize: buildQueryValue(pageSize),
    paginate: buildQueryValue(paginate),
    whitelist: buildQueryValue(whitelist),
    blacklist: buildQueryValue(blacklist),
    updateAssociationValues: buildQueryValue(updateAssociationValues),
    forceUpdate: buildQueryValue(forceUpdate),
  };

  Object.keys(query).forEach((key) => {
    if (typeof query[key] === 'undefined') {
      delete query[key];
    }
  });

  return query;
}

function buildRequestPayload(args: BusinessTableCrudArgs) {
  if (typeof args.values === 'undefined') {
    return undefined;
  }

  return args.values;
}

function buildHeaders(args: BusinessTableCrudArgs, context?: McpToolCallContext) {
  const incomingHeaders = context?.headers || {};
  const headers: Record<string, any> = {};

  // The generic CRUD tool targets internal business APIs. Reusing arbitrary MCP
  // transport headers here can pollute the injected request and cause auth
  // mismatches that do not affect swagger-generated tools.
  const forwardedRole = normalizeHeaderValue(incomingHeaders['x-role'] || incomingHeaders['X-Role']);
  if (forwardedRole) {
    headers['x-role'] = forwardedRole;
  }

  const forwardedAuthenticator = normalizeHeaderValue(
    incomingHeaders['x-authenticator'] || incomingHeaders['X-Authenticator'],
  );
  if (forwardedAuthenticator) {
    headers['x-authenticator'] = forwardedAuthenticator;
  }

  if (context?.token) {
    headers.authorization = `Bearer ${context.token}`;
  } else {
    const authorization = normalizeHeaderValue(incomingHeaders.authorization || incomingHeaders.Authorization);
    if (authorization) {
      headers.authorization = authorization;
    }
  }

  headers['content-type'] = 'application/json';

  if (args.dataSource && args.dataSource !== 'main') {
    headers['x-data-source'] = args.dataSource;
  }

  return headers;
}

function createCrudActionToolMeta(args: BusinessTableCrudArgs): McpTool {
  return {
    name: 'crud',
    description: 'Generic CRUD fallback tool',
    resourceName: args.resource,
    actionName: args.action,
    call: async () => null,
  };
}

export function createCrudTool(options: {
  app: {
    callback: () => any;
    resourcer: { options?: { prefix?: string } };
  };
  mcpToolsManager: McpToolsManager;
}): McpTool {
  const prefix = options.app.resourcer.options?.prefix || '/api';

  return {
    name: 'crud',
    description:
      'A generic fallback CRUD tool for business tables. Use this only when no more specific MCP tool can complete the task. Before calling it, first use data-model-related MCP tools to get the exact collection and field metadata so the resource name, filter fields, and values fields are correct. Then specify the data source, resource name, action, and query/write parameters to operate on records.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['resource', 'action'],
      properties: {
        dataSource: {
          type: 'string',
          description: 'Data source key. Defaults to main.',
        },
        resource: {
          type: 'string',
          description:
            'Resource name, such as users, orders, or association resources like users.roles and posts.comments.',
        },
        action: {
          type: 'string',
          enum: ['list', 'get', 'create', 'update', 'destroy'],
          description: 'CRUD action to execute on the resource.',
        },
        sourceId: {
          anyOf: [{ type: 'string' }, { type: 'number' }],
          description: 'Source record ID for association resources like posts.comments.',
        },
        filterByTk: {
          anyOf: [
            { type: 'string' },
            { type: 'number' },
            {
              type: 'array',
              items: {
                anyOf: [{ type: 'string' }, { type: 'number' }],
              },
            },
          ],
          description: 'Primary key value used by get, update, or destroy actions.',
        },
        values: {
          type: 'object',
          description: 'Record values used by create or update.',
          additionalProperties: true,
        },
        filter: {
          type: 'object',
          description: 'Filter object for list, update, or destroy.',
          additionalProperties: true,
        },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Fields to query.',
        },
        appends: {
          type: 'array',
          items: { type: 'string' },
          description: 'Association or appended fields to include.',
        },
        except: {
          type: 'array',
          items: { type: 'string' },
          description: 'Fields to exclude from the result.',
        },
        sort: {
          type: 'array',
          items: { type: 'string' },
          description: 'Sort fields, such as ["-createdAt"].',
        },
        page: {
          type: 'number',
          description: 'Page number for list action.',
        },
        pageSize: {
          type: 'number',
          description: 'Page size for list action.',
        },
        paginate: {
          type: 'boolean',
          description: 'Whether to use pagination for list action.',
        },
        whitelist: {
          type: 'array',
          items: { type: 'string' },
          description: 'Fields allowed to be written.',
        },
        blacklist: {
          type: 'array',
          items: { type: 'string' },
          description: 'Fields forbidden to be written.',
        },
        updateAssociationValues: {
          type: 'array',
          items: { type: 'string' },
          description: 'Association fields that should be updated together.',
        },
        forceUpdate: {
          type: 'boolean',
          description: 'Whether update should force writing unchanged values.',
        },
      },
    },
    call: async (args: Record<string, any>, context?: McpToolCallContext) => {
      const typedArgs = (args || {}) as BusinessTableCrudArgs;
      const url = `${prefix.replace(/\/$/, '')}/${buildActionUrl(
        typedArgs.resource,
        typedArgs.action,
        typedArgs.sourceId,
      )}`;

      const response = await inject(options.app.callback(), {
        method: 'POST',
        url,
        query: buildRequestQuery(typedArgs),
        headers: buildHeaders(typedArgs, context),
        payload: buildRequestPayload(typedArgs),
      });

      const contentType = String(response.headers['content-type'] || '').toLowerCase();
      const body =
        contentType.includes('application/json') || contentType.includes('+json')
          ? (() => {
              try {
                return response.json();
              } catch (error) {
                return response.payload;
              }
            })()
          : response.payload;

      if (response.statusCode >= 400) {
        throw new Error(
          JSON.stringify({
            statusCode: response.statusCode,
            body,
          }),
        );
      }

      return options.mcpToolsManager.postProcessToolResult(createCrudActionToolMeta(typedArgs), body, {
        args: typedArgs,
        callContext: context,
        response: {
          statusCode: response.statusCode,
          headers: response.headers,
          body,
        },
      });
    },
  };
}
