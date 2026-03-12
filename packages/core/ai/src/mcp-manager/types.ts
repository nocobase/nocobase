/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface MCPManager extends MCPRegistration {
  getMCP(name: string): Promise<MCPEntry>;
  listMCP(filter: MCPFilter): Promise<MCPEntry[]>;
  persistence(): Promise<void>;
}
export interface MCPRegistration {
  registerMCP(registration: { [key: string | symbol]: MCPOptions }): void;
}

export type MCPOptions = {
  transport: MCPTransport;
  command?: string;
  args?: string[];
  env: Record<string, string>;
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
