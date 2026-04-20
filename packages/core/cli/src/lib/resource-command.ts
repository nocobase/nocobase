import { Command, Flags } from '@oclif/core';
import type { Interfaces } from '@oclif/core';
import { executeResourceRequest, type ResourceAction, type ResourceRequestArgs } from './resource-request.js';
import { setVerboseMode } from './ui.js';

function parseJson<T>(value: string, flagName: string): T {
  try {
    return JSON.parse(value) as T;
  } catch (error: any) {
    throw new Error(`Invalid JSON for --${flagName}: ${error?.message ?? 'parse failed'}`);
  }
}

function parseFlexibleValue(value: string | undefined, flagName: string) {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return value;
  }

  if (trimmed.startsWith('[') || trimmed.startsWith('{') || trimmed === 'null' || trimmed === 'true' || trimmed === 'false') {
    return parseJson(trimmed, flagName);
  }

  return value;
}

function parseObjectFlag(value: string | undefined, flagName: string) {
  if (value === undefined) {
    return undefined;
  }

  const parsed = parseJson<Record<string, any>>(value, flagName);
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
    throw new Error(`--${flagName} must be a JSON object`);
  }

  return parsed;
}

function parseJsonArrayFlag(value: string | undefined, flagName: string) {
  if (value === undefined) {
    return undefined;
  }

  const parsed = parseJson<Array<Record<string, any>>>(value, flagName);
  if (!Array.isArray(parsed)) {
    throw new Error(`--${flagName} must be a JSON array`);
  }

  return parsed;
}

function parseStringArrayFlags(value: string[] | string | undefined, flagName: string) {
  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    if (value.length === 1) {
      const trimmed = value[0].trim();
      if (trimmed.startsWith('[')) {
        const parsed = parseJson<string[]>(trimmed, flagName);
        if (!Array.isArray(parsed)) {
          throw new Error(`--${flagName} must be repeated or use a JSON array`);
        }

        return parsed.map((item) => String(item));
      }
    }

    return value.map((item) => String(item));
  }

  const trimmed = value.trim();
  if (trimmed.startsWith('[')) {
    const parsed = parseJson<string[]>(trimmed, flagName);
    if (!Array.isArray(parsed)) {
      throw new Error(`--${flagName} must be repeated or use a JSON array`);
    }

    return parsed.map((item) => String(item));
  }

  return [String(value)];
}

function printResponse(command: Command, response: { ok: boolean; status: number; data: unknown }, jsonOutput: boolean) {
  if (!response.ok) {
    command.error(`Request failed with status ${response.status}\n${JSON.stringify(response.data, null, 2)}`);
  }

  if (jsonOutput) {
    command.log(JSON.stringify(response.data, null, 2));
    return;
  }

  command.log(`HTTP ${response.status}`);
}

export const resourceBaseFlags = {
  'base-url': Flags.string({
    description: 'NocoBase API base URL, for example http://localhost:13000/api',
  }),
  verbose: Flags.boolean({
    description: 'Show detailed progress output',
    default: false,
  }),
  env: Flags.string({
    char: 'e',
    description: 'Environment name',
  }),
  role: Flags.string({
    description: 'Role override, sent as X-Role',
  }),
  token: Flags.string({
    char: 't',
    description: 'API key override',
  }),
  'json-output': Flags.boolean({
    char: 'j',
    description: 'Print raw JSON response',
    default: true,
    allowNo: true,
  }),
  resource: Flags.string({
    description: 'Resource name such as users, orders, or association resources like posts.comments',
    required: true,
  }),
  'data-source': Flags.string({
    description: 'Data source key. Defaults to main.',
  }),
} satisfies Interfaces.FlagInput<any>;

export const resourceAssociationFlags = {
  'source-id': Flags.string({
    description: 'Source record ID for association resources like posts.comments.',
  }),
} satisfies Interfaces.FlagInput<any>;

export const listFlags = {
  ...resourceBaseFlags,
  ...resourceAssociationFlags,
  filter: Flags.string({
    description: 'Filter object as JSON',
  }),
  fields: Flags.string({
    description: 'Fields to query. Repeat the flag or pass a JSON array.',
    multiple: true,
  }),
  appends: Flags.string({
    description: 'Association or appended fields to include. Repeat the flag or pass a JSON array.',
    multiple: true,
  }),
  except: Flags.string({
    description: 'Fields to exclude from the result. Repeat the flag or pass a JSON array.',
    multiple: true,
  }),
  sort: Flags.string({
    description: 'Sort fields such as -createdAt. Repeat the flag or pass a JSON array.',
    multiple: true,
  }),
  page: Flags.integer({
    description: 'Page number for list action.',
  }),
  'page-size': Flags.integer({
    description: 'Page size for list action.',
  }),
  paginate: Flags.boolean({
    description: 'Whether to use pagination for list action.',
    allowNo: true,
  }),
} satisfies Interfaces.FlagInput<any>;

export const getFlags = {
  ...resourceBaseFlags,
  ...resourceAssociationFlags,
  'filter-by-tk': Flags.string({
    description: 'Primary key value used by get. Supports JSON arrays for composite or multiple keys.',
  }),
  fields: Flags.string({
    description: 'Fields to query. Repeat the flag or pass a JSON array.',
    multiple: true,
  }),
  appends: Flags.string({
    description: 'Association or appended fields to include. Repeat the flag or pass a JSON array.',
    multiple: true,
  }),
  except: Flags.string({
    description: 'Fields to exclude from the result. Repeat the flag or pass a JSON array.',
    multiple: true,
  }),
} satisfies Interfaces.FlagInput<any>;

export const createFlags = {
  ...resourceBaseFlags,
  ...resourceAssociationFlags,
  values: Flags.string({
    description: 'Record values used by create as a JSON object.',
    required: true,
  }),
  whitelist: Flags.string({
    description: 'Fields allowed to be written. Repeat the flag or pass a JSON array.',
    multiple: true,
  }),
  blacklist: Flags.string({
    description: 'Fields forbidden to be written. Repeat the flag or pass a JSON array.',
    multiple: true,
  }),
} satisfies Interfaces.FlagInput<any>;

export const updateFlags = {
  ...resourceBaseFlags,
  ...resourceAssociationFlags,
  'filter-by-tk': Flags.string({
    description: 'Primary key value used by update. Supports JSON arrays for composite or multiple keys.',
  }),
  filter: Flags.string({
    description: 'Filter object for update as JSON.',
  }),
  values: Flags.string({
    description: 'Record values used by update as a JSON object.',
    required: true,
  }),
  whitelist: Flags.string({
    description: 'Fields allowed to be written. Repeat the flag or pass a JSON array.',
    multiple: true,
  }),
  blacklist: Flags.string({
    description: 'Fields forbidden to be written. Repeat the flag or pass a JSON array.',
    multiple: true,
  }),
  'update-association-values': Flags.string({
    description: 'Association fields that should be updated together. Repeat the flag or pass a JSON array.',
    multiple: true,
  }),
  'force-update': Flags.boolean({
    description: 'Whether update should force writing unchanged values.',
    allowNo: true,
  }),
} satisfies Interfaces.FlagInput<any>;

export const destroyFlags = {
  ...resourceBaseFlags,
  ...resourceAssociationFlags,
  'filter-by-tk': Flags.string({
    description: 'Primary key value used by destroy. Supports JSON arrays for composite or multiple keys.',
  }),
  filter: Flags.string({
    description: 'Filter object for destroy as JSON.',
  }),
} satisfies Interfaces.FlagInput<any>;

export const queryFlags = {
  ...resourceBaseFlags,
  measures: Flags.string({
    description: 'Measure definitions for query aggregation as a JSON array.',
  }),
  dimensions: Flags.string({
    description: 'Dimension definitions for query aggregation as a JSON array.',
  }),
  orders: Flags.string({
    description: 'Order definitions for query aggregation as a JSON array.',
  }),
  filter: Flags.string({
    description: 'Filter object for query as JSON.',
  }),
  having: Flags.string({
    description: 'Having object for grouped query as JSON.',
  }),
  limit: Flags.integer({
    description: 'Limit for query result rows.',
  }),
  offset: Flags.integer({
    description: 'Offset for query result rows.',
  }),
  timezone: Flags.string({
    description: 'Optional timezone for query formatting.',
  }),
} satisfies Interfaces.FlagInput<any>;

function pickSharedArgs(flags: Record<string, any>): Pick<ResourceRequestArgs, 'resource' | 'dataSource' | 'sourceId'> {
  return {
    resource: flags.resource,
    dataSource: flags['data-source'],
    sourceId: parseFlexibleValue(flags['source-id'], 'source-id') as string | number | undefined,
  };
}

export function buildListArgs(flags: Record<string, any>): ResourceRequestArgs {
  return {
    ...pickSharedArgs(flags),
    filter: parseObjectFlag(flags.filter, 'filter'),
    fields: parseStringArrayFlags(flags.fields, 'fields'),
    appends: parseStringArrayFlags(flags.appends, 'appends'),
    except: parseStringArrayFlags(flags.except, 'except'),
    sort: parseStringArrayFlags(flags.sort, 'sort'),
    page: flags.page,
    pageSize: flags['page-size'],
    paginate: flags.paginate,
  };
}

export function buildGetArgs(flags: Record<string, any>): ResourceRequestArgs {
  return {
    ...pickSharedArgs(flags),
    filterByTk: parseFlexibleValue(flags['filter-by-tk'], 'filter-by-tk') as
      | string
      | number
      | Array<string | number>
      | undefined,
    fields: parseStringArrayFlags(flags.fields, 'fields'),
    appends: parseStringArrayFlags(flags.appends, 'appends'),
    except: parseStringArrayFlags(flags.except, 'except'),
  };
}

export function buildCreateArgs(flags: Record<string, any>): ResourceRequestArgs {
  return {
    ...pickSharedArgs(flags),
    values: parseObjectFlag(flags.values, 'values'),
    whitelist: parseStringArrayFlags(flags.whitelist, 'whitelist'),
    blacklist: parseStringArrayFlags(flags.blacklist, 'blacklist'),
  };
}

export function buildUpdateArgs(flags: Record<string, any>): ResourceRequestArgs {
  return {
    ...pickSharedArgs(flags),
    filterByTk: parseFlexibleValue(flags['filter-by-tk'], 'filter-by-tk') as
      | string
      | number
      | Array<string | number>
      | undefined,
    filter: parseObjectFlag(flags.filter, 'filter'),
    values: parseObjectFlag(flags.values, 'values'),
    whitelist: parseStringArrayFlags(flags.whitelist, 'whitelist'),
    blacklist: parseStringArrayFlags(flags.blacklist, 'blacklist'),
    updateAssociationValues: parseStringArrayFlags(flags['update-association-values'], 'update-association-values'),
    forceUpdate: flags['force-update'],
  };
}

export function buildDestroyArgs(flags: Record<string, any>): ResourceRequestArgs {
  return {
    ...pickSharedArgs(flags),
    filterByTk: parseFlexibleValue(flags['filter-by-tk'], 'filter-by-tk') as
      | string
      | number
      | Array<string | number>
      | undefined,
    filter: parseObjectFlag(flags.filter, 'filter'),
  };
}

export function buildQueryArgs(flags: Record<string, any>): ResourceRequestArgs {
  return {
    ...pickSharedArgs(flags),
    measures: parseJsonArrayFlag(flags.measures, 'measures'),
    dimensions: parseJsonArrayFlag(flags.dimensions, 'dimensions'),
    orders: parseJsonArrayFlag(flags.orders, 'orders'),
    filter: parseObjectFlag(flags.filter, 'filter'),
    having: parseObjectFlag(flags.having, 'having'),
    limit: flags.limit,
    offset: flags.offset,
    timezone: flags.timezone,
  };
}

export async function runResourceCommand(
  command: Command,
  action: ResourceAction,
  flags: Record<string, any>,
  args: ResourceRequestArgs,
) {
  setVerboseMode(Boolean(flags.verbose));

  const response = await executeResourceRequest({
    envName: flags.env,
    baseUrl: flags['base-url'],
    role: flags.role,
    token: flags.token,
    action,
    args,
  });

  printResponse(command, response, flags['json-output']);
}
