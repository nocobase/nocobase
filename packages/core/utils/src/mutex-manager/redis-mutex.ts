import { Redis } from 'ioredis';
import { default as Redlock, Lock, ResourceLockedError } from 'redlock';
import { BaseMutexInterface } from './base-mutex';

// const defaultTimeout = 10 * 1000;
const defaultTimeout = 60 * 1000;

interface LockPack {
  instance: Lock;
  start_time: number;
}

export class RedisMutex implements BaseMutexInterface {
  private client: Redis = null;
  private redlock: Redlock = null;
  private locks: Map<string, LockPack> = new Map<string, LockPack>();
  private autoExtendTimer: NodeJS.Timeout = null;

  constructor() {
    this.init();
  }

  private init() {
    this.client = new Redis({
      host: process.env.REDIS_HOST,
      port: Number.parseInt(process.env.REDIS_PORT),
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD,
      db: Number.parseInt(process.env.REDIS_DB),
    });
    this.redlock = new Redlock([this.client], {
      // The expected clock drift; for more details see:
      // http://redis.io/topics/distlock
      driftFactor: 0.01,

      // The max number of times Redlock will attempt to lock a resource
      // before erroring.
      retryCount: 10,

      // the time in ms between attempts
      retryDelay: 200,

      // the max time in ms randomly added to retries
      // to improve performance under high contention
      // see https://www.awsarchitectureblog.com/2015/03/backoff.html
      retryJitter: 200,

      // The minimum remaining time on a lock before an extension is automatically
      // attempted with the `using` API.
      automaticExtensionThreshold: 500, // time in ms
    });
    this.client.on('error', function (err) {
      if (err instanceof ResourceLockedError) {
        return;
      }
      console.error('A redis error has occurred:', err);
    });
    this.redlock.on('error', function (err) {
      if (err instanceof ResourceLockedError) {
        return;
      }
      console.error('A redis error has occurred:', err);
    });
    this.startAutoExtend();
    process.on('SIGINT', async () => {
      await this.close();
    });

    console.log('RedisMutex initialized');
  }

  async close() {
    if (this.redlock) {
      await this.releaseAll();
      this.redlock.quit();
    }

    clearInterval(this.autoExtendTimer);

    this.client = null;
    this.redlock = null;
    this.autoExtendTimer = null;

    console.log('RedisMutex closed');
  }

  async acquire(name: string): Promise<any> {
    if (this.redlock == null) {
      this.init();
    }
    let lock = await this.redlock.acquire([name], defaultTimeout / 1000);
    this.locks.set(name, {
      instance: lock,
      start_time: Date.now(),
    });
    return lock;
  }

  async release(name: string): Promise<any> {
    let lock = this.locks.get(name);
    if (!lock) {
      return;
    }
    this.locks.delete(name);
    let result = await lock.instance.release();
    return result;
  }

  async releaseAll(): Promise<any> {
    for (const [name, lock] of this.locks) {
      await lock.instance.release();
    }
    this.locks.clear();
  }

  async startAutoExtend(): Promise<any> {
    clearInterval(this.autoExtendTimer);

    this.autoExtendTimer = setInterval(async () => {
      if (this.locks.size == 0) {
        return;
      }
      for (const [name, lock] of this.locks) {
        if (Date.now() - lock.start_time < 10 * 60 * 1000) {
          await lock.instance.extend(defaultTimeout / 1000);
        } else {
          // tested ok to delete map entry wich for...of loop
          await this.release(name);
        }
      }
    }, defaultTimeout / 2);
  }
}
