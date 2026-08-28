/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Logger } from '@nocobase/logger';
import { readFile } from 'node:fs/promises';
import { AIManager } from '../ai-manager';
import { MCPOptions, MCPTransport } from '../mcp-manager';
import { LoadAndRegister } from './types';

export type MCPLoaderOptions = { serversPath: string; log?: Logger };

type MCPFileEntry = MCPOptions & { name: string };

const supportedTransports = new Set<MCPTransport>(['stdio', 'http', 'sse']);
const connectionSettingKeys = ['command', 'args', 'env', 'url', 'headers', 'restart', 'useUserContext'] as const;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.getPrototypeOf(value) === Object.prototype;

export class MCPLoader extends LoadAndRegister<MCPLoaderOptions> {
  protected content: string | null = null;
  protected entries: MCPFileEntry[] = [];
  protected log?: Logger;

  constructor(
    protected readonly ai: AIManager,
    protected readonly options: MCPLoaderOptions,
  ) {
    super(ai, options);
    this.log = options.log;
  }

  protected async scan(): Promise<void> {
    this.content = null;
    this.entries = [];

    try {
      this.content = await readFile(this.options.serversPath, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.log?.error(`MCP server configuration ignored: failed to read ${this.options.serversPath}`, error);
      }
    }
  }

  protected async import(): Promise<void> {
    if (this.content === null) {
      return;
    }

    try {
      const parsed: unknown = JSON.parse(this.content);
      this.entries = this.validateEntries(parsed);
    } catch (error) {
      this.entries = [];
      this.log?.error(`MCP server configuration ignored: invalid file ${this.options.serversPath}`, error);
    }
  }

  protected async register(): Promise<void> {
    for (const entry of this.entries) {
      const { name, ...options } = entry;
      try {
        await this.ai.mcpManager.registerMCP({
          [name]: {
            ...options,
            fromFile: true,
          },
        });
      } catch (error) {
        this.log?.error(`MCP server [${name}] registration ignored`, error);
      }
    }
  }

  private validateEntries(value: unknown): MCPFileEntry[] {
    if (!Array.isArray(value)) {
      throw new Error('Root value must be an array');
    }

    const names = new Set<string>();
    return value.map((item, index) => {
      if (!isPlainObject(item)) {
        throw new Error(`Entry at index ${index} must be a plain object`);
      }
      if (typeof item.name !== 'string' || !item.name.trim()) {
        throw new Error(`Entry at index ${index} must have a non-empty string name`);
      }
      if (typeof item.transport !== 'string' || !supportedTransports.has(item.transport as MCPTransport)) {
        throw new Error(`Entry [${item.name}] must use a supported transport`);
      }
      if (names.has(item.name)) {
        throw new Error(`Duplicate MCP server name: ${item.name}`);
      }
      if (
        Object.prototype.hasOwnProperty.call(item, 'enabled') ||
        Object.prototype.hasOwnProperty.call(item, 'fromFile')
      ) {
        throw new Error(`Entry [${item.name}] must not define enabled or fromFile`);
      }
      names.add(item.name);

      const entry: MCPFileEntry = {
        name: item.name,
        transport: item.transport as MCPTransport,
      };
      for (const key of connectionSettingKeys) {
        if (Object.prototype.hasOwnProperty.call(item, key)) {
          Object.assign(entry, { [key]: item[key] });
        }
      }
      return entry;
    });
  }
}
