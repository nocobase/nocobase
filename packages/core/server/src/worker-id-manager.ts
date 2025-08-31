/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Redis } from 'ioredis';
import { RedisConnectionManager } from './redis-connection-manager';
import Application from './application';
import { AppSupervisor } from './app-supervisor';
import fs from 'fs';
import os from 'os';

function isContainerEnvironment(): boolean {
  try {
    return fs.existsSync('/.dockerenv') || fs.readFileSync('/proc/1/cgroup', 'utf8').includes('docker');
  } catch {
    return false;
  }
}

function getLocalIP(): string | null {
  const interfaces = os.networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }

  return null;
}

export class WorkerIdManager {
  private static instance: WorkerIdManager;
  private redisConn: Redis;
  private mainApp: Application;
  private identifier: string;
  private workerId = -1;
  private maxWorkerId = 511;
  private renewInterval = 60;
  private leaseSeconds = 120;
  private renewTimer: NodeJS.Timeout;

  constructor() {
    this.mainApp = AppSupervisor.getInstance().getMainApp();
    this.identifier = this.getIdentifier();
    this.mainApp?.log.info(`worker id manager initialized with identifier: ${this.identifier}`, {
      module: 'worker-id-manager',
    });
    this.onAfterMainAppStop();

    this.redisConn = RedisConnectionManager.getConnection();
  }

  public static getInstance(): WorkerIdManager {
    if (!this.instance) {
      this.instance = new WorkerIdManager();
    }

    return this.instance;
  }

  public static async getWorkerId() {
    const instance = this.getInstance();
    if (instance.workerId >= 0) {
      return instance.workerId;
    }
    if (!instance.redisConn) {
      return 0;
    }

    for (let id = 0; id <= instance.maxWorkerId; id++) {
      const key = `snowflake:worker:${id}`;
      const result = await instance.redisConn.set(key, instance.identifier, 'EX', instance.leaseSeconds, 'NX');

      if (result === 'OK') {
        instance.workerId = id;
        instance.startRenewal();
        instance.mainApp?.log.info(`Allocated worker ID: ${id}`, {
          module: 'worker-id-manager',
          method: 'getWorkerId',
        });
        return id;
      }
    }

    instance.mainApp?.log.error('Cannot allocate worker ID, all IDs are in use', {
      module: 'worker-id-manager',
      method: 'getWorkerId',
    });
    throw new Error('Cannot allocate worker Id, all IDs are in use');
  }

  private startRenewal() {
    this.renewTimer = setInterval(async () => {
      await this.renewLease();
    }, this.renewInterval * 1000);
  }

  private async renewLease(times = 3) {
    try {
      const key = `snowflake:worker:${this.workerId}`;

      const luaScript = `
        if redis.call('GET', KEYS[1]) == ARGV[1] then
          return redis.call('EXPIRE', KEYS[1], ARGV[2])
        else
          return 0
        end
      `;

      const result = await this.redisConn.eval(luaScript, 1, key, this.identifier, this.leaseSeconds.toString());
      if (result === 1) {
        this.mainApp?.log.trace('Renew worker id successfully', {
          module: 'worker-id-manager',
          method: 'renewLease',
        });
        return;
      } else {
        throw new Error('Failed to renew lease');
      }
    } catch (err) {
      if (times > 0) {
        this.mainApp?.log.warn(`Failed to renew worker ID lease, retrying...`, {
          err,
          module: 'worker-id-manager',
          method: 'renewLease',
        });
        return this.renewLease(times - 1);
      } else {
        this.mainApp?.log.error(`Failed to renew worker ID lease after multiple attempts`, {
          err,
          module: 'worker-id-manager',
          method: 'renewLease',
        });
      }
    }
  }

  private async release() {
    if (this.workerId < 0 || !this.redisConn) {
      return;
    }

    try {
      const key = `snowflake:worker:${this.workerId}`;

      const luaScript = `
        if redis.call('GET', KEYS[1]) == ARGV[1] then
          return redis.call('DEL', KEYS[1])
        else
          return 0
        end
      `;

      await this.redisConn.eval(luaScript, 1, key, this.identifier);
      this.mainApp?.log.debug(`Released worker ID: ${this.workerId}`, {
        module: 'worker-id-manager',
        method: 'release',
        identifier: this.identifier,
        workerId: this.workerId,
      });
    } catch (err) {
      this.mainApp?.log.error(`Failed to release worker ID: ${this.workerId}`, {
        err,
        module: 'worker-id-manager',
        method: 'release',
        identifier: this.identifier,
        workerId: this.workerId,
      });
    } finally {
      this.workerId = -1;
      if (this.renewTimer) {
        clearInterval(this.renewTimer);
      }
    }
  }

  private onAfterMainAppStop() {
    if (this.mainApp) {
      this.mainApp.on('afterStop', async () => {
        await this.release();
      });
    }
  }

  private getIdentifier() {
    if (process.env.POD_IP) {
      return process.env.POD_IP;
    }

    if (!isContainerEnvironment()) {
      const ip = getLocalIP();
      if (ip) {
        return ip;
      }
    }

    return process.env.HOSTNAME || os.hostname();
  }
}
