/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Redis from 'ioredis';
import { AppSupervisor } from './app-supervisor';
import Application from './application';

interface RedisConfig {
  connectionString: string;
}

export class RedisConnectionManager {
  private static instance: RedisConnectionManager;
  private mainApp: Application;
  private config: RedisConfig;
  private connections: Map<string, Redis> = new Map();

  private constructor(redisConfig: RedisConfig) {
    this.config = redisConfig;
    this.mainApp = AppSupervisor.getInstance().getMainApp();
  }

  public static getInstance(): RedisConnectionManager {
    const connectionString = process.env.REDIS_URL;
    if (!this.instance) {
      this.instance = new RedisConnectionManager({
        connectionString,
      });
      this.instance.onAfterMainAppStop();
    }

    return this.instance;
  }

  public static getConnection(key = 'default', config?: RedisConfig): Redis | null {
    const instance = this.getInstance();
    let conn = instance.connections.get(key);
    if (conn) {
      return conn;
    }
    config = config || instance.config;
    const connectionString = config.connectionString;
    if (!connectionString) {
      return null;
    }
    conn = new Redis(connectionString);
    instance.connections.set(key, conn);

    conn.on('connect', () => {
      instance.mainApp?.log.info(`Redis connected`, {
        module: 'redis-connection-manager',
        method: 'getConnection',
        key,
        config,
      });
    });

    conn.on('error', (err) => {
      instance.mainApp?.log.error(err.message, {
        err,
        module: 'redis-connection-manager',
        method: 'getConnection',
        key,
        config,
      });
    });

    conn.on('close', () => {
      instance.mainApp?.log.trace(`Redis closed`, {
        module: 'redis-connection-manager',
        method: 'getConnection',
        key,
        config,
      });
    });

    return conn;
  }

  async close() {
    for (const conn of this.connections.values()) {
      if (!conn?.status || conn.status === 'close' || conn.status === 'end') {
        continue;
      }
      await conn.quit();
    }
  }

  private onAfterMainAppStop() {
    if (this.mainApp) {
      this.mainApp.on('afterStop', async () => {
        await this.close();
      });
    }
  }
}
