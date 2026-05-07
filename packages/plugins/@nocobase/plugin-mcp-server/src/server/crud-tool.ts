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
type QueryAction = 'query';
type ToolAction = CrudAction | QueryAction;

type CollectionBaseArgs = {
  dataSource?: string;
  resource: string;
};

type CollectionAssociationArgs = {
  sourceId?: string | number;
};

type CollectionFilterByTkArgs = {
  filterByTk?: string | number | Array<string | number>;
};

type CollectionFieldSelectionArgs = {
  fields?: string[];
  appends?: string[];
  except?: string[];
};

type CollectionListArgs = CollectionBaseArgs &
  CollectionAssociationArgs &
  CollectionFieldSelectionArgs & {
    filter?: Record<string, any>;
    sort?: string[];
    page?: number;
    pageSize?: number;
    paginate?: boolean;
  };

type CollectionGetArgs = CollectionBaseArgs &
  CollectionAssociationArgs &
  CollectionFilterByTkArgs &
  CollectionFieldSelectionArgs;

type CollectionCreateArgs = CollectionBaseArgs &
  CollectionAssociationArgs & {
    values?: Record<string, any>;
    whitelist?: string[];
    blacklist?: string[];
  };

type CollectionUpdateArgs = CollectionBaseArgs &
  CollectionAssociationArgs &
  CollectionFilterByTkArgs & {
    values?: Record<string, any>;
    filter?: Record<string, any>;
    whitelist?: string[];
    blacklist?: string[];
    updateAssociationValues?: string[];
    forceUpdate?: boolean;
  };

type CollectionDestroyArgs = CollectionBaseArgs &
  CollectionAssociationArgs &
  CollectionFilterByTkArgs & {
    filter?: Record<string, any>;
  };

type CollectionCrudArgs =
  | CollectionListArgs
  | CollectionGetArgs
  | CollectionCreateArgs
  | CollectionUpdateArgs
  | CollectionDestroyArgs;

type CollectionQueryArgs = CollectionBaseArgs & {
  measures?: Array<Record<string, any>>;
  dimensions?: Array<Record<string, any>>;
  orders?: Array<Record<string, any>>;
  filter?: Record<string, any>;
  having?: Record<string, any>;
  limit?: number;
  offset?: number;
  timezone?: string;
};

type CollectionToolArgs = CollectionCrudArgs | CollectionQueryArgs;

type CollectionRequestQueryArgs = {
  filterByTk?: string | number | Array<string | number>;
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

function buildActionUrl(resource: string, action: ToolAction, sourceId?: string | number) {
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

function buildRequestQuery(args: CollectionRequestQueryArgs) {
  const query: Record<string, any> = {
    filterByTk: buildQueryValue(args.filterByTk),
    filter: buildQueryValue(args.filter),
    fields: buildQueryValue(args.fields),
    appends: buildQueryValue(args.appends),
    except: buildQueryValue(args.except),
    sort: buildQueryValue(args.sort),
    page: buildQueryValue(args.page),
    pageSize: buildQueryValue(args.pageSize),
    paginate: buildQueryValue(args.paginate),
    whitelist: buildQueryValue(args.whitelist),
    blacklist: buildQueryValue(args.blacklist),
    updateAssociationValues: buildQueryValue(args.updateAssociationValues),
    forceUpdate: buildQueryValue(args.forceUpdate),
  };

  Object.keys(query).forEach((key) => {
    if (typeof query[key] === 'undefined') {
      delete query[key];
    }
  });

  return query;
}

function buildHeaders(args: CollectionToolArgs, context?: McpToolCallContext) {
  const incomingHeaders = context?.headers || {};
  const headers: Record<string, any> = {};

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

  if ('timezone' in args && args.timezone) {
    headers['x-timezone'] = args.timezone;
  }

  return headers;
}

function buildQueryPayload(args: CollectionQueryArgs) {
  const payload: Record<string, any> = {
    measures: args.measures,
    dimensions: args.dimensions,
    orders: args.orders,
    filter: args.filter,
    having: args.having,
    limit: args.limit,
    offset: args.offset,
  };

  Object.keys(payload).forEach((key) => {
    if (typeof payload[key] === 'undefined') {
      delete payload[key];
    }
  });

  return payload;
}

function buildCrudPayload(action: CrudAction, args: CollectionCrudArgs) {
  if ((action === 'create' || action === 'update') && 'values' in args) {
    return args.values;
  }
}

function buildActionQuery(action: ToolAction, args: CollectionToolArgs) {
  if (action === 'query') {
    return undefined;
  }

  return buildRequestQuery(args as CollectionRequestQueryArgs);
}

function buildActionPayload(action: ToolAction, args: CollectionToolArgs) {
  if (action === 'query') {
    return buildQueryPayload(args as CollectionQueryArgs);
  }

  return buildCrudPayload(action, args as CollectionCrudArgs);
}

function createSharedCall(
  options: {
    app: {
      callback: () => any;
      resourcer: { options?: { prefix?: string } };
    };
    mcpToolsManager: McpToolsManager;
  },
  action: ToolAction,
  tool: McpTool,
) {
  const prefix = options.app.resourcer.options?.prefix || '/api';

  return async (args: Record<string, any>, context?: McpToolCallContext) => {
    const typedArgs = (args || {}) as CollectionToolArgs;
    const actionPath = buildActionUrl(
      typedArgs.resource,
      action,
      'sourceId' in typedArgs ? typedArgs.sourceId : undefined,
    );
    const url = `${prefix.replace(/\/$/, '')}/${actionPath}`;

    const response = await inject(options.app.callback(), {
      method: 'POST',
      url,
      query: buildActionQuery(action, typedArgs),
      headers: buildHeaders(typedArgs, context),
      payload: buildActionPayload(action, typedArgs),
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

    return options.mcpToolsManager.postProcessToolResult(
      {
        ...tool,
        resourceName: typedArgs.resource,
        actionName: action,
        path: `/${actionPath}`,
        method: 'POST',
      },
      body,
      {
        args: typedArgs,
        callContext: context,
        response: {
          statusCode: response.statusCode,
          headers: response.headers,
          body,
        },
      },
    );
  };
}

function createTool(
  options: {
    app: {
      callback: () => any;
      resourcer: { options?: { prefix?: string } };
    };
    mcpToolsManager: McpToolsManager;
  },
  action: ToolAction,
  name: string,
  description: string,
  inputSchema: any,
): McpTool {
  const tool = {
    name,
    description,
    inputSchema,
  } as McpTool;

  tool.call = createSharedCall(options, action, tool);
  return tool;
}

function createBaseResourceSchema(resourceDescription: string) {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['resource'],
    properties: {
      dataSource: {
        type: 'string',
        description: 'Data source key. Defaults to main.',
      },
      resource: {
        type: 'string',
        description: resourceDescription,
      },
    },
  };
}

const resourceSchemaDescription =
  'Resource name, such as users, orders, or association resources like users.roles and posts.comments.';

function createListToolSchema() {
  const base = createBaseResourceSchema(resourceSchemaDescription);
  return {
    ...base,
    properties: {
      ...base.properties,
      sourceId: {
        anyOf: [{ type: 'string' }, { type: 'number' }],
        description: 'Source record ID for association resources like posts.comments.',
      },
      filter: {
        type: 'object',
        description: 'Filter object for list.',
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
    },
  };
}

function createGetToolSchema() {
  const base = createBaseResourceSchema(resourceSchemaDescription);
  return {
    ...base,
    properties: {
      ...base.properties,
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
        description: 'Primary key value used by get.',
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
    },
  };
}

function createCreateToolSchema() {
  const base = createBaseResourceSchema(resourceSchemaDescription);
  return {
    ...base,
    required: [...base.required, 'values'],
    properties: {
      ...base.properties,
      sourceId: {
        anyOf: [{ type: 'string' }, { type: 'number' }],
        description: 'Source record ID for association resources like posts.comments.',
      },
      values: {
        type: 'object',
        description: 'Record values used by create.',
        additionalProperties: true,
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
    },
  };
}

function createUpdateToolSchema() {
  const base = createBaseResourceSchema(resourceSchemaDescription);
  return {
    ...base,
    required: [...base.required, 'values'],
    properties: {
      ...base.properties,
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
        description: 'Primary key value used by update.',
      },
      filter: {
        type: 'object',
        description: 'Filter object for update.',
        additionalProperties: true,
      },
      values: {
        type: 'object',
        description: 'Record values used by update.',
        additionalProperties: true,
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
  };
}

function createDestroyToolSchema() {
  const base = createBaseResourceSchema(resourceSchemaDescription);
  return {
    ...base,
    properties: {
      ...base.properties,
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
        description: 'Primary key value used by destroy.',
      },
      filter: {
        type: 'object',
        description: 'Filter object for destroy.',
        additionalProperties: true,
      },
    },
  };
}

function createQueryToolSchema() {
  const queryFieldSchema = {
    anyOf: [
      { type: 'string' },
      {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
      },
    ],
  };

  const queryMeasureSchema = {
    type: 'object',
    additionalProperties: true,
    required: ['field'],
    properties: {
      field: queryFieldSchema,
      type: {
        type: 'string',
        description: 'Optional field type hint.',
      },
      aggregation: {
        type: 'string',
        description: 'Aggregation function, such as count, sum, avg, max, or min.',
      },
      alias: {
        type: 'string',
        description: 'Output field alias.',
      },
      distinct: {
        type: 'boolean',
        description: 'Whether to apply distinct before aggregation.',
      },
    },
  };

  const queryDimensionSchema = {
    type: 'object',
    additionalProperties: true,
    required: ['field'],
    properties: {
      field: queryFieldSchema,
      type: {
        type: 'string',
        description: 'Optional field type hint.',
      },
      alias: {
        type: 'string',
        description: 'Output field alias.',
      },
      format: {
        type: 'string',
        description: 'Optional output format, usually for date and time dimensions.',
      },
      options: {
        type: 'object',
        description: 'Additional formatter options.',
        additionalProperties: true,
      },
    },
  };

  const queryOrderSchema = {
    type: 'object',
    additionalProperties: true,
    required: ['field'],
    properties: {
      field: queryFieldSchema,
      alias: {
        type: 'string',
        description: 'Alias to sort by when the selected field is projected with an alias.',
      },
      order: {
        type: 'string',
        enum: ['asc', 'desc'],
        description: 'Sort direction.',
      },
      nulls: {
        type: 'string',
        enum: ['default', 'first', 'last'],
        description: 'Null value ordering.',
      },
    },
  };

  return {
    type: 'object',
    additionalProperties: false,
    required: ['resource'],
    properties: {
      dataSource: {
        type: 'string',
        description: 'Data source key. Defaults to main.',
      },
      resource: {
        type: 'string',
        description: 'Collection resource name, such as users or orders.',
      },
      measures: {
        type: 'array',
        description: 'Measure definitions for query aggregation.',
        items: queryMeasureSchema,
      },
      dimensions: {
        type: 'array',
        description: 'Dimension definitions for query aggregation.',
        items: queryDimensionSchema,
      },
      orders: {
        type: 'array',
        description: 'Order definitions for query aggregation.',
        items: queryOrderSchema,
      },
      filter: {
        type: 'object',
        description: 'Filter object for query.',
        additionalProperties: true,
      },
      having: {
        type: 'object',
        description: 'Having object for grouped query.',
        additionalProperties: true,
      },
      limit: {
        type: 'number',
        description: 'Limit for query result rows.',
      },
      offset: {
        type: 'number',
        description: 'Offset for query result rows.',
      },
      timezone: {
        type: 'string',
        description: 'Optional timezone for query formatting.',
      },
    },
  };
}

export function createCrudTools(options: {
  app: {
    callback: () => any;
    resourcer: { options?: { prefix?: string } };
  };
  mcpToolsManager: McpToolsManager;
}): McpTool[] {
  const listSchema = createListToolSchema();
  const getSchema = createGetToolSchema();
  const createSchema = createCreateToolSchema();
  const updateSchema = createUpdateToolSchema();
  const destroySchema = createDestroyToolSchema();
  const querySchema = createQueryToolSchema();

  return [
    createTool(options, 'list', 'resource_list', 'List records from a collection.', listSchema),
    createTool(options, 'get', 'resource_get', 'Get a record from a collection.', getSchema),
    createTool(options, 'create', 'resource_create', 'Create a record in a collection.', createSchema),
    createTool(options, 'update', 'resource_update', 'Update records in a collection.', updateSchema),
    createTool(options, 'destroy', 'resource_destroy', 'Delete records from a collection.', destroySchema),
    createTool(options, 'query', 'resource_query', 'Run an aggregate query on a collection.', querySchema),
  ];
}
