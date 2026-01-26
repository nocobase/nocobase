/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Logger } from '@nocobase/logger';
import merge from 'lodash/merge';
import { createClient } from 'redis';

type RedisClientOptions = NonNullable<Parameters<typeof createClient>[0]>;
export type Redis = ReturnType<typeof createClient>;

export interface RedisConfig extends RedisClientOptions {
  connectionString?: string;
}

export class RedisConnectionManager {
  private logger: Logger;
  private config: RedisConfig;
  private connections: Map<string, Redis> = new Map();
  private connectionConfigs: Map<string, RedisConfig> = new Map();
  private connecting: WeakMap<Redis, Promise<unknown>> = new WeakMap();

  constructor(config: { redisConfig?: RedisConfig; logger: Logger }) {
    this.config = config.redisConfig || {};
    this.logger = config.logger;
  }

  private bindEvents(conn: Redis, key: string, config?: RedisConfig) {
    conn.on('connect', () => {
      this.logger.info(`Redis connected`, {
        method: 'getConnection',
        key,
      });
    });

    conn.on('ready', () => {
      this.logger.trace(`Redis ready`, {
        method: 'getConnection',
        key,
      });
    });

    conn.on('error', (err) => {
      this.logger.error(err.message, {
        err,
        method: 'getConnection',
        key,
      });
    });

    conn.on('end', () => {
      this.logger.trace(`Redis closed`, {
        method: 'getConnection',
        key,
      });
    });
  }

  private mergeConfig(config?: RedisConfig): RedisConfig {
    return merge({}, this.config || {}, config || {});
  }

  private hasConnectionOptions(config?: RedisConfig) {
    if (!config) {
      return false;
    }
    return Boolean(config.connectionString || config.url || config.socket);
  }

  private buildClientOptions(config: RedisConfig): RedisClientOptions {
    const { connectionString, ...rest } = config;
    const options = { ...(rest as RedisClientOptions) };
    if (connectionString && !options.url) {
      options.url = connectionString;
    }
    return options;
  }

  private ensureConnected(conn: Redis, key: string, config?: RedisConfig) {
    if (conn.isOpen || this.connecting.has(conn)) {
      return;
    }
    const promise = conn
      .connect()
      .catch((err) => {
        this.logger.error(err.message, {
          err,
          method: 'connect',
          key,
          config,
        });
        this.connections.delete(key);
        this.connectionConfigs.delete(key);
        throw err;
      })
      .finally(() => {
        this.connecting.delete(conn);
      });
    this.connecting.set(conn, promise);
  }

  private getClient(key = 'default', config?: RedisConfig): Redis | null {
    let conn = this.connections.get(key);
    if (conn) {
      this.ensureConnected(conn, key, this.connectionConfigs.get(key));
      return conn;
    }

    const cfg = this.mergeConfig(config);
    if (!this.hasConnectionOptions(cfg)) {
      return null;
    }

    conn = createClient(this.buildClientOptions(cfg));
    this.connections.set(key, conn);
    this.connectionConfigs.set(key, cfg);
    this.bindEvents(conn, key, cfg);
    this.ensureConnected(conn, key, cfg);
    return conn;
  }

  getConnection(key = 'default', config?: RedisConfig): Redis | null {
    return this.getClient(key, config);
  }

  private async waitUntilReady(conn: Redis): Promise<Redis> {
    if (conn.isReady) {
      return conn;
    }

    const pendingConnect = this.connecting.get(conn);
    if (pendingConnect) {
      await pendingConnect;
      if (conn.isReady) {
        return conn;
      }
    } else if (!conn.isOpen) {
      await conn.connect();
      if (conn.isReady) {
        return conn;
      }
    }

    return new Promise((resolve, reject) => {
      const cleanup = () => {
        conn.off('ready', handleReady);
        conn.off('error', handleError);
      };
      const handleReady = () => {
        cleanup();
        resolve(conn);
      };
      const handleError = (err: Error) => {
        cleanup();
        reject(err);
      };
      conn.once('ready', handleReady);
      conn.once('error', handleError);
    });
  }

  async getConnectionSync(key = 'default', config?: RedisConfig): Promise<Redis> {
    const conn = this.getClient(key, config);
    if (!conn) {
      throw new Error('Redis connection configuration is missing');
    }
    return this.waitUntilReady(conn);
  }

  private async closeConnection(key: string, conn: Redis) {
    if (!conn?.isOpen) {
      return;
    }
    try {
      await conn.quit();
    } catch (err) {
      this.logger.warn(`Failed to quit redis connection`, {
        err,
        method: 'closeConnection',
        key,
      });
      try {
        conn.destroy();
      } catch (disconnectErr) {
        this.logger.warn(`Failed to disconnect redis connection`, {
          err: disconnectErr,
          method: 'closeConnection',
          key,
        });
      }
    }
  }

  async close() {
    for (const [key, conn] of this.connections.entries()) {
      await this.closeConnection(key, conn);
    }
  }
}
