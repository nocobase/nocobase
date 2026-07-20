/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import { MultiServerMCPClient, StdioConnection, StreamableHTTPConnection } from '@langchain/mcp-adapters';
import { StructuredToolInterface } from '@langchain/core/tools';
import type { MCPEntry, MCPOptions } from './types';
import { renderMCPOptions } from './options-renderer';

type MCPConnection = StdioConnection | StreamableHTTPConnection;

type CacheEntry = {
  client: MultiServerMCPClient;
  toolsMap: Record<string, StructuredToolInterface[]>;
  expiresAt: number;
  lastAccessedAt: number;
};

export type UserContextMCPClientManagerOptions = {
  app: any;
  listEntries: () => Promise<MCPEntry[]>;
  buildConnection: (options: MCPOptions) => MCPConnection;
  ttlMs?: number;
  maxSize?: number;
};

export class UserContextMCPClientManager {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly ttlMs: number;
  private readonly maxSize: number;

  constructor(private readonly options: UserContextMCPClientManagerOptions) {
    this.ttlMs = options.ttlMs ?? 5 * 60 * 1000;
    this.maxSize = options.maxSize ?? 100;
  }

  async getToolsMap(ctx: Context): Promise<Record<string, StructuredToolInterface[]>> {
    const currentUser = ctx?.state?.currentUser ?? ctx?.auth?.user;
    if (!currentUser?.id) {
      return {};
    }

    let client: MultiServerMCPClient | null = null;
    try {
      this.evictExpired();

      const entries = (await this.options.listEntries())
        .filter((entry) => entry.enabled !== false && entry.useUserContext === true && entry.transport !== 'stdio')
        .sort((left, right) => left.name.localeCompare(right.name));
      if (!entries.length) {
        return {};
      }

      const cacheKey = String(currentUser.id);
      const cached = this.cache.get(cacheKey);
      const now = Date.now();
      if (cached && cached.expiresAt > now) {
        cached.lastAccessedAt = now;
        return cached.toolsMap;
      }

      if (cached) {
        await this.closeEntry(cached);
        this.cache.delete(cacheKey);
      }

      const connections: Record<string, MCPConnection> = {};
      for (const entry of entries) {
        const rendered = await renderMCPOptions(entry, this.options.app, ctx);
        connections[entry.name] = this.options.buildConnection(rendered);
      }

      client = new MultiServerMCPClient(connections);
      const initializedToolsMap = await client.initializeConnections();
      const toolsMap = Object.fromEntries(
        Object.entries(initializedToolsMap).map(([serverName, tools]) => [
          serverName,
          tools as StructuredToolInterface[],
        ]),
      );

      this.cache.set(cacheKey, {
        client,
        toolsMap,
        expiresAt: now + this.ttlMs,
        lastAccessedAt: now,
      });
      client = null;
      await this.evictOversized();

      return toolsMap;
    } catch (error) {
      if (client) {
        await this.closeEntry({
          client,
          toolsMap: {},
          expiresAt: 0,
          lastAccessedAt: 0,
        });
      }
      this.options.app?.log?.warn?.('fail to get user-bound mcp tools', error);
      return {};
    }
  }

  async clear() {
    const entries = [...this.cache.values()];
    this.cache.clear();
    await Promise.all(entries.map((entry) => this.closeEntry(entry)));
  }

  private evictExpired() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key);
        this.closeEntry(entry).catch((error) => {
          this.options.app?.log?.warn?.('fail to close expired user-bound mcp client', error);
        });
      }
    }
  }

  private async evictOversized() {
    while (this.cache.size > this.maxSize) {
      const oldest = [...this.cache.entries()].sort(
        ([, left], [, right]) => left.lastAccessedAt - right.lastAccessedAt,
      )[0];
      if (!oldest) {
        return;
      }
      this.cache.delete(oldest[0]);
      await this.closeEntry(oldest[1]);
    }
  }

  private async closeEntry(entry: CacheEntry) {
    try {
      await entry.client.close();
    } catch (error) {
      this.options.app?.log?.warn?.('fail to close user-bound mcp client', error);
    }
  }
}
