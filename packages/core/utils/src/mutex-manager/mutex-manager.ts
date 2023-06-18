import * as _ from 'lodash';
import { Mutex } from 'async-mutex';
import { RedisMutex } from './redis-mutex';
import { BaseMutexInterface } from './base-mutex';

export interface MutexConfig {
  type?: string;
  gapAfterRun?: number;
  options?: any;
}

interface MutexPack {
  instance: Mutex;
  readyTime?: number;
}

export interface MutexNameHelperConfig {
  dbDialect?: string;
  dbHost?: string;
  dbPort?: number;
  dbStorage?: string;
  dbName?: string;
  tableName?: string;
  other?: string;
  action?: string;
}

export class MutexManager {
  private mutexProviders: Map<string, BaseMutexInterface> = new Map<string, BaseMutexInterface>();
  private mutexes: Map<string, MutexPack> = new Map<string, MutexPack>();
  private deamonApp: any;

  private static defaultMutexProviderType = 'redis';
  private static instance: MutexManager;

  public static getInstance(): MutexManager {
    if (!MutexManager.instance) {
      MutexManager.instance = new MutexManager();
    }
    return MutexManager.instance;
  }

  private constructor() {}

  public setupEventListeners(app: any) {
    if (this.deamonApp) {
      return;
    }
    this.deamonApp = app;
    this.deamonApp.on('beforeStart', this.onBeforeStart.bind(this));
  }

  private onBeforeStart() {
    this.tryRegisterDefaultMutexProvider();
    if (!this.deamonApp?.db) {
      return;
    }
    this.deamonApp.db.on('afterClose', async () => {
      this.deamonApp.off('beforeStart', this.onBeforeStart);
      this.deamonApp = null;
      for (const mutexProvider of this.mutexProviders.values()) {
        await mutexProvider.close();
      }
      this.mutexes.clear();
    });
  }

  private tryRegisterDefaultMutexProvider() {
    if (process.env.REDIS_MUTEX == 'on' && !this.mutexProviders.has(MutexManager.defaultMutexProviderType)) {
      this.registerMutexProvider(MutexManager.defaultMutexProviderType, new RedisMutex());
    }
  }

  public registerMutexProvider(type: string, mutex: BaseMutexInterface) {
    this.mutexProviders.set(type, mutex);
  }

  private getMutexProvider(type: string): BaseMutexInterface {
    let provider = this.mutexProviders.get(type);

    if (!provider) {
      provider = this.mutexProviders.get(MutexManager.defaultMutexProviderType);
    }

    if (!provider) {
      return null;
    }

    return provider;
  }

  private getMutex(name: string): MutexPack {
    if (!this.mutexes.has(name)) {
      this.mutexes.set(name, { instance: new Mutex() });
    }
    return this.mutexes.get(name)!;
  }

  public async runExclusive(name: string, fn: () => Promise<any>, config?: MutexConfig): Promise<any> {
    if (!name) {
      throw new Error('Mutex name is required');
    }

    const mutex = this.getMutex(name);

    return mutex.instance.runExclusive(async () => {
      await this.waitBeforeRun(mutex);

      const mutexProvider = this.getMutexProvider(config?.type);
      if (mutexProvider) {
        await mutexProvider.acquire(name);
      }

      let fnResult = await fn();

      if (config?.gapAfterRun) {
        mutex.readyTime = Date.now() + config.gapAfterRun;

        if (mutexProvider) {
          setTimeout(async () => {
            await mutexProvider.release(name);
          }, config.gapAfterRun);
        }
      } else if (mutexProvider) {
        await mutexProvider.release(name);
      }

      return fnResult;
    });
  }

  private async waitBeforeRun(mutex: MutexPack) {
    if (mutex.readyTime) {
      const waitTime = mutex.readyTime - Date.now();
      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  /**
   * Helper function to generate a mutex name
   * @param config
   * @returns `${db_type}_${db_host}_${db_port}_${db_name}_${table_name}_${other}_${action}`
   */
  public static nameHelper(config: MutexNameHelperConfig): string {
    const prefix = 'mutex_manager:';
    if (config.dbStorage) {
      config.dbStorage = _.last(_.split(config.dbStorage, '/'));
      config.dbStorage = _.last(_.split(config.dbStorage, '\\')); // for windows
    }

    let name = `${prefix}${config.dbDialect ?? ''}_${config.dbHost ?? ''}_${config.dbPort ?? ''}_${
      config.dbStorage ?? ''
    }_${config.dbName ?? ''}_${config.tableName ?? ''}_${config.other ?? ''}_${config.action ?? ''}`;

    name = name.replace(/_+/g, '_');
    name = name.replace(/_$/, '');

    console.log(`Mutex name: ${name}`);

    return name;
  }
}
