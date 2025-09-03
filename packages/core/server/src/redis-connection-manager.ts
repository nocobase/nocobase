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
    return new Promise((resolve, reject) => {
      const conn = this.getClient(key, config);
      if (!conn) {
        return reject(new Error('Redis connect string is missing'));
      }

      conn.once('connect', () => resolve(conn));
      conn.once('error', reject);
    });
  }

  async close() {
    for (const conn of this.connections.values()) {
      if (!conn?.status || conn.status === 'close' || conn.status === 'end') {
        continue;
      }
      await conn.quit();
    }
  }
}
