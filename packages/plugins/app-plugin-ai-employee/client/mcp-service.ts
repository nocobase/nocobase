import type { ApiClient } from '@nocobase/app-client';

import { aiPath, requestAI } from './api-client.js';

export type MCPTransport = 'stdio' | 'http' | 'sse';

export interface MCPRecord extends Record<string, unknown> {
  name: string;
  title?: string;
  description?: string;
  enabled: boolean;
  transport: MCPTransport;
  command?: string | null;
  url?: string | null;
  args: string[];
  env: Record<string, string>;
  headers: Record<string, string>;
}

/**
 * A configured server is tested by name. Only a remote server can be tested
 * from inline values; stdio runs a local command and must be configured.
 */
export type MCPTestValues =
  | { name: string }
  | {
      transport: Exclude<MCPTransport, 'stdio'>;
      url: string;
      headers?: Record<string, string>;
    };

export interface MCPTestResult {
  success: boolean;
  message?: string;
  error?: string;
  details?: string;
  toolsCount?: number;
  tools?: string[];
  toolsTruncated?: boolean;
}

export interface MCPToolEntry {
  name: string;
  i18n?: { namespace: string };
  title: string;
  description?: string;
  serverName: string;
  permission: 'ASK' | 'ALLOW';
}

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const isTransport = (value: unknown): value is MCPTransport =>
  value === 'stdio' || value === 'http' || value === 'sse';

const asStringRecord = (value: unknown): Record<string, string> => {
  if (!isRecord(value)) return {};
  return Object.entries(value).reduce<Record<string, string>>(
    (result, [key, entry]) => {
      if (
        typeof entry === 'string' ||
        typeof entry === 'number' ||
        typeof entry === 'boolean'
      )
        result[key] = String(entry);
      return result;
    },
    {},
  );
};

const asMCPRecord = (value: unknown): MCPRecord | undefined => {
  if (
    !isRecord(value) ||
    typeof value.name !== 'string' ||
    !isTransport(value.transport)
  )
    return undefined;
  return {
    ...value,
    name: value.name,
    title: typeof value.title === 'string' ? value.title : '',
    description: typeof value.description === 'string' ? value.description : '',
    enabled: value.enabled !== false,
    transport: value.transport,
    command: typeof value.command === 'string' ? value.command : null,
    url: typeof value.url === 'string' ? value.url : null,
    args: Array.isArray(value.args) ? value.args.map(String) : [],
    env: asStringRecord(value.env),
    headers: asStringRecord(value.headers),
  };
};

export async function listMCPServers(api: ApiClient): Promise<MCPRecord[]> {
  const servers = await requestAI<unknown[]>(
    api,
    aiPath('aiEmployee', 'mcpServers'),
  );
  return servers.flatMap((item) => {
    const record = asMCPRecord(item);
    return record ? [record] : [];
  });
}

/** A configured server is tested by name, using only its saved configuration; a remote one by its values. */
export async function testMCPConnection(
  api: ApiClient,
  values: MCPTestValues,
): Promise<MCPTestResult> {
  const result = await requestAI<unknown>(
    api,
    'name' in values
      ? aiPath('aiEmployee', 'mcpServers', values.name, 'testConnection')
      : aiPath('aiEmployee', 'mcpServers', 'testConnection'),
    { method: 'POST', ...('name' in values ? {} : { body: values }) },
  );
  if (!isRecord(result) || typeof result.success !== 'boolean')
    throw new Error('MCP test response is invalid.');
  return {
    success: result.success,
    message: typeof result.message === 'string' ? result.message : undefined,
    error: typeof result.error === 'string' ? result.error : undefined,
    details: typeof result.details === 'string' ? result.details : undefined,
    toolsCount:
      typeof result.toolsCount === 'number' ? result.toolsCount : undefined,
    tools: Array.isArray(result.tools)
      ? result.tools.filter((tool): tool is string => typeof tool === 'string')
      : undefined,
    toolsTruncated:
      typeof result.toolsTruncated === 'boolean'
        ? result.toolsTruncated
        : undefined,
  };
}

export async function updateMCPServerEnabled(
  api: ApiClient,
  name: string,
  enabled: boolean,
): Promise<void> {
  await requestAI<unknown>(
    api,
    aiPath('aiEmployee', 'mcpServers', name, enabled ? 'enable' : 'disable'),
    { method: 'POST' },
  );
}

export async function updateMCPToolPermission(
  api: ApiClient,
  serverName: string,
  toolName: string,
  permission: 'ASK' | 'ALLOW',
): Promise<void> {
  await requestAI<unknown>(
    api,
    aiPath('aiEmployee', 'mcpServers', serverName, 'tools', toolName),
    { method: 'PATCH', body: { permission } },
  );
}

export async function listMCPTools(
  api: ApiClient,
): Promise<Record<string, MCPToolEntry[]>> {
  const result = await requestAI<unknown>(
    api,
    aiPath('aiEmployee', 'mcpServers', 'tools'),
  );
  if (!isRecord(result)) return {};
  return Object.entries(result).reduce<Record<string, MCPToolEntry[]>>(
    (tools, [serverName, entries]) => {
      tools[serverName] = Array.isArray(entries)
        ? entries.filter(isMCPToolEntry)
        : [];
      return tools;
    },
    {},
  );
}

function isMCPToolEntry(value: unknown): value is MCPToolEntry {
  return (
    isRecord(value) &&
    typeof value.name === 'string' &&
    typeof value.title === 'string' &&
    typeof value.serverName === 'string'
  );
}
