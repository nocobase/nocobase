/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import PluginAIServer from '../plugin';

export class VectorDatabaseManager {
  constructor(private readonly plugin: PluginAIServer) {}

  validateConnectParams(providerName: string, connectParams: unknown): void {
    this.vectorDatabaseProvider.validateConnectParams(providerName, connectParams);
  }

  async getConnection<R>(id: string): Promise<R> {
    const vectorDatabaseInfo = await this.vectorDatabase.getVectorDatabaseInfo(id);
    if (!vectorDatabaseInfo) {
      throw new Error(`Vector database ${id} not found`);
    }
    const { name, connectProps } = vectorDatabaseInfo;
    if (!connectProps) {
      throw new Error(`Vector database ${id} is not connected`);
    }
    this.vectorDatabaseProvider.validateConnectParams(name, connectProps);
    return this.vectorDatabaseProvider.createConnection(name, connectProps);
  }

  private get vectorDatabase() {
    return this.plugin.features.vectorDatabase;
  }

  private get vectorDatabaseProvider() {
    return this.plugin.features.vectorDatabaseProvider;
  }
}
