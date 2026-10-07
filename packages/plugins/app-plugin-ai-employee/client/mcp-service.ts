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
