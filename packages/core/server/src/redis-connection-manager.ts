/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Redis from 'ioredis';
import { Logger } from '@nocobase/logger';

export { Redis };

export interface RedisConfig {
  connectionString: string;
}

export class RedisConnectionManager {
  private logger: Logger;
  private config: RedisConfig;
  private connections: Map<string, Redis> = new Map();

  constructor(config: { redisConfig: RedisConfig; logger: Logger }) {
    this.config = config.redisConfig;
    this.logger = config.logger;
  }

  private bindEvents(conn: Redis, key: string, config?: RedisConfig) {
    conn.on('connect', () => {
      this.logger.info(`Redis connected`, {
        method: 'getConnection',
        key,
        config,
      });
    });

    conn.on('error', (err) => {
      this.logger.error(err.message, {
        err,
        method: 'getConnection',
        key,
        config,
      });
    });

    conn.on('close', () => {
      this.logger.trace(`Redis closed`, {
        method: 'getConnection',
        key,
        config,
      });
    });
  }

  private getClient(key = 'default', config?: RedisConfig): Redis | null {
    let conn = this.connections.get(key);
    if (conn) {
      return conn;
    }

    const cfg = config || this.config;
    if (!cfg.connectionString) {
      return null;
    }

    conn = new Redis(cfg.connectionString);
    this.connections.set(key, conn);
    this.bindEvents(conn, key, cfg);
    return conn;
  }

  getConnection(key = 'default', config?: RedisConfig): Redis | null {
    return this.getClient(key, config);
  }

  async getConnectionSync(key = 'default', config?: RedisConfig): Promise<Redis> {
    const conn = this.getClient(key, config);
    if (!conn) {
      throw new Error('Redis connect string is missing');
    }
    if (conn.status === 'ready') {
      return conn;
    }
    return new Promise((resolve, reject) => {
      conn.once('connect', () => resolve(conn));
      conn.once('error', reject);
    });
  }

  private async exitSubscriberMode(key: string, conn: Redis) {
    if (conn.mode !== 'subscriber') {
      return;
    }

    const unsubscribeCommands = ['unsubscribe', 'punsubscribe', 'sunsubscribe'] as const;
    for (const command of unsubscribeCommands) {
      const fn = (conn as any)[command];
      if (typeof fn !== 'function') {
        continue;
      }
      try {
        await fn.call(conn);
      } catch (err) {
        this.logger.warn(`Failed to ${command} redis connection`, {
          err,
          method: 'exitSubscriberMode',
          key,
        });
      }
    }
  }

  private async closeConnection(key: string, conn: Redis) {
    if (!conn?.status || conn.status === 'close' || conn.status === 'end') {
      return;
    }

    await this.exitSubscriberMode(key, conn);

    try {
      await conn.quit();
    } catch (err) {
      this.logger.warn(`Failed to quit redis connection`, {
        err,
        method: 'closeConnection',
        key,
      });
      conn.disconnect();
    }
  }

  async close() {
    for (const [key, conn] of this.connections.entries()) {
      await this.closeConnection(key, conn);
    }
  }
}
