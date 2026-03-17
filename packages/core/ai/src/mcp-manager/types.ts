/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { MultiServerMCPClient } from '@langchain/mcp-adapters';
import type { DynamicToolsProvider, Permission } from '../tools-manager/types';

export interface MCPManager extends MCPRegistration {
  getMCP(name: string): Promise<MCPEntry>;
  listMCP(filter: MCPFilter): Promise<MCPEntry[]>;
  testConnection(options: MCPOptions): Promise<MCPTestResult>;
  rebuildClient(): Promise<void>;
  getClient(): MultiServerMCPClient | null;
  getMCPToolsProvider(): DynamicToolsProvider;
  listMCPTools(): Promise<Record<string, MCPToolEntry[]>>;
  updateMCPToolPermission(toolName: string, permission: Permission): Promise<void>;
}

export interface MCPRegistration {
  registerMCP(registration: { [key: string | symbol]: MCPOptions }): Promise<void>;
}

export type MCPOptions = {
  transport: MCPTransport;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
  restart?: Record<string, any>;
};

export type MCPEntry = MCPOptions & {
  name: string;
  enabled: boolean;
};

export type MCPFilter = {
  name?: string;
  enabled?: boolean;
  transport?: MCPTransport;
};

export type MCPTransport = 'stdio' | 'sse' | 'http';

export type MCPTestResult = {
  success: boolean;
  message?: string;
  error?: string;
  details?: string;
  toolsCount?: number;
  tools?: string[];
  toolsTruncated?: boolean;
};

export type MCPToolEntry = {
  name: string;
  title: string;
  description?: string;
  serverName: string;
  permission: Permission;
};
