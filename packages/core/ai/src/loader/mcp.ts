/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { storagePathJoin } from '@nocobase/utils';
import type { Logger } from '@nocobase/logger';
import { readFile } from 'node:fs/promises';
import type { MCPOptions, MCPRegistration } from '../mcp-manager/types';
import { normalizeMCPOptions } from '../mcp-manager/options-renderer';

export type MCPLoaderOptions = { log?: Pick<Logger, 'error'> };

export class MCPLoader {
  constructor(
    private readonly manager: MCPRegistration,
    private readonly options: MCPLoaderOptions = {},
  ) {}

  async load(): Promise<void> {
    const filePath = storagePathJoin('ai', 'mcp', 'servers.json');
    let content: string;
    try {
      content = await readFile(filePath, 'utf8');
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
        return;
      }
      this.options.log?.error(`MCP file ignored at ${filePath}: unable to read file`);
      return;
    }

    let definitions: unknown;
    try {
      definitions = JSON.parse(content);
    } catch {
      // JSON parser messages may contain configuration fragments, including secrets.
      this.options.log?.error(`MCP file ignored at ${filePath}: invalid JSON`);
      return;
    }
    if (!Array.isArray(definitions)) {
      this.options.log?.error(`MCP file ignored at ${filePath}: expected an array`);
      return;
    }

    const registration: Record<string, MCPOptions> = Object.create(null);
    for (const [index, value] of (definitions as unknown[]).entries()) {
      const definition = value as Record<string, unknown>;
      let reason: string | undefined;
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        reason = 'expected an object';
      } else if (typeof definition.name !== 'string' || !definition.name.trim()) {
        reason = 'name is required';
      } else if (!(['stdio', 'http', 'sse'] as unknown[]).includes(definition.transport)) {
        reason = 'unsupported or missing transport';
      } else if (Object.hasOwn(value, 'enabled') || Object.hasOwn(value, 'fromFile')) {
        reason = 'enabled and fromFile cannot be specified';
      } else if (Object.hasOwn(registration, definition.name as string)) {
        reason = 'duplicate name';
      }
      if (reason) {
        this.options.log?.error(`MCP file ignored at ${filePath}, entry ${index + 1}: ${reason}`);
        return;
      }
      // Keep the existing permissive connection-field normalization; only the file envelope is validated here.
      try {
        registration[definition.name as string] = normalizeMCPOptions({ ...definition, fromFile: true } as MCPOptions);
      } catch {
        this.options.log?.error(
          `MCP file ignored at ${filePath}, entry ${index + 1}: unable to normalize configuration`,
        );
        return;
      }
    }

    if (!Object.keys(registration).length) {
      return;
    }
    try {
      // Register only after the entire file passes validation.
      await this.manager.registerMCP(registration);
    } catch {
      this.options.log?.error(`MCP registration failed at ${filePath}`);
    }
  }
}
