import { executeRawApiRequest } from './api-client.js';

export type ResourceAction = 'list' | 'get' | 'create' | 'update' | 'destroy' | 'query';

export interface ResourceRequestArgs {
  dataSource?: string;
  resource: string;
  sourceId?: string | number;
  filterByTk?: string | number | Array<string | number>;
  filter?: Record<string, any>;
  fields?: string[];
  appends?: string[];
  except?: string[];
  sort?: string[];
  page?: number;
  pageSize?: number;
  paginate?: boolean;
  values?: Record<string, any>;
  whitelist?: string[];
  blacklist?: string[];
  updateAssociationValues?: string[];
  forceUpdate?: boolean;
  measures?: Array<Record<string, any>>;
  dimensions?: Array<Record<string, any>>;
  orders?: Array<Record<string, any>>;
  having?: Record<string, any>;
  limit?: number;
  offset?: number;
  timezone?: string;
}

function buildActionUrl(resource: string, action: ResourceAction, sourceId?: string | number) {
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

function buildRequestQuery(args: ResourceRequestArgs) {
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

  for (const key of Object.keys(query)) {
    if (typeof query[key] === 'undefined') {
      delete query[key];
    }
  }

  return query;
}

function buildQueryPayload(args: ResourceRequestArgs) {
  const payload: Record<string, any> = {
    measures: args.measures,
    dimensions: args.dimensions,
    orders: args.orders,
    filter: args.filter,
    having: args.having,
    limit: args.limit,
    offset: args.offset,
  };

  for (const key of Object.keys(payload)) {
    if (typeof payload[key] === 'undefined') {
      delete payload[key];
    }
  }

  return payload;
}

function buildCrudPayload(action: ResourceAction, args: ResourceRequestArgs) {
  if ((action === 'create' || action === 'update') && args.values) {
    return args.values;
  }
}

function buildActionQuery(action: ResourceAction, args: ResourceRequestArgs) {
  if (action === 'query') {
    return undefined;
  }

  return buildRequestQuery(args);
}

function buildActionPayload(action: ResourceAction, args: ResourceRequestArgs) {
  if (action === 'query') {
    return buildQueryPayload(args);
  }

  return buildCrudPayload(action, args);
}

function buildHeaders(action: ResourceAction, args: ResourceRequestArgs) {
  const headers: Record<string, string> = {};

  if (args.dataSource && args.dataSource !== 'main') {
    headers['x-data-source'] = args.dataSource;
  }

  if (action === 'query' && args.timezone) {
    headers['x-timezone'] = args.timezone;
  }

  return headers;
}

export async function executeResourceRequest(options: {
  envName?: string;
  baseUrl?: string;
  token?: string;
  role?: string;
  action: ResourceAction;
  args: ResourceRequestArgs;
}) {
  const path = `/${buildActionUrl(options.args.resource, options.action, options.args.sourceId)}`;

  return executeRawApiRequest({
    envName: options.envName,
    baseUrl: options.baseUrl,
    role: options.role,
    token: options.token,
    method: 'POST',
    path,
    query: buildActionQuery(options.action, options.args),
    body: buildActionPayload(options.action, options.args),
    headers: buildHeaders(options.action, options.args),
  });
}
