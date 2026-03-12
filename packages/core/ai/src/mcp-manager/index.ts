/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SequelizeCollectionManager } from '@nocobase/data-source-manager';
import { Op } from '@nocobase/database';
import { Registry } from '@nocobase/utils';
import { MCPEntry, MCPFilter, MCPManager, MCPOptions } from './types';

export class DefaultMCPManager implements MCPManager {
  private readonly mcpRegistry = new Registry<MCPEntry>();

  constructor(private readonly provideCollectionManager: () => { collectionManager: SequelizeCollectionManager }) {}

  registerMCP(registration: { [key: string | symbol]: MCPOptions }): void {
    for (const [name, options] of Object.entries(registration)) {
      this.mcpRegistry.register(name, this.normalizeEntry(name, options));
    }
  }

  async getMCP(name: string): Promise<MCPEntry> {
    return (await this.aiMcpClientsModel?.findOne({ where: { name } }))?.toJSON() as MCPEntry;
  }

  async listMCP(filter: MCPFilter = {}): Promise<MCPEntry[]> {
    const where = {};
    if (filter.name) {
      where['name'] = {
        [Op.substring]: filter.name,
      };
    }
    if (filter.enabled != null) {
      where['enabled'] = filter.enabled;
    }
    if (filter.transport) {
      where['transport'] = filter.transport;
    }
    return (await this.aiMcpClientsModel?.findAll({ where }))?.map((item) => item.toJSON() as MCPEntry) ?? [];
  }

  async persistence(): Promise<void> {
    if (!(await this.isAIMcpCollectionSync())) {
      return;
    }

    for (const entry of this.mcpRegistry.getValues()) {
      await this.persistenceEntry(entry);
    }
  }

  private async persistenceEntry(entry: MCPEntry): Promise<void> {
    await this.sequelize.transaction(async (transaction) => {
      const existed = await this.aiMcpClientsModel.findOne({ where: { name: entry.name }, transaction });
      if (existed) {
        await existed.update(
          {
            transport: entry.transport,
            command: entry.command,
            args: entry.args,
            env: entry.env,
            url: entry.url,
            headers: entry.headers,
            restart: entry.restart,
          },
          { transaction },
        );
        return;
      }

      await this.aiMcpClientsModel.create(
        {
          ...entry,
        },
        { transaction },
      );
    });
  }

  private normalizeEntry(name: string, options: MCPOptions): MCPEntry {
    return {
      name,
      enabled: true,
      ...options,
      args: options.args ?? [],
      env: options.env ?? {},
    };
  }

  private async isAIMcpCollectionSync() {
    return this.aiMcpClientsCollection?.existsInDb() ?? Promise.resolve(false);
  }

  private get aiMcpClientsCollection() {
    return this.collectionManager.getCollection('aiMcpClients');
  }

  private get aiMcpClientsModel() {
    return this.aiMcpClientsCollection?.model;
  }

  private get sequelize() {
    return this.collectionManager.db.sequelize;
  }

  private get collectionManager() {
    return this.provideCollectionManager().collectionManager;
  }
}

export function defineMCP(options: MCPOptions) {
  return options;
}

export * from './types';
