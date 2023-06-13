import * as _ from 'lodash';
import { Mutex } from 'async-mutex';
import { RedisMutex } from './redis-mutex';
import { BaseMutexInterface } from './base-mutex';

export interface MutexConfig {
  type?: string;
  options?: any;
}

export interface MutexNameHelperConfig {
  db_dialect?: string;
  db_host?: string;
  db_port?: number;
  db_storage?: string;
  db_name?: string;
  table_name?: string;
  other?: string;
  action?: string;
}

export class MutexManager {
  private mutexProviders: Map<string, BaseMutexInterface> = new Map<string, BaseMutexInterface>();
  private mutexes: Map<string, Mutex> = new Map<string, Mutex>();
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
    this.deamonApp.on('beforeStart', this.onBeforeStart);
  }

  private onBeforeStart() {
    this.tryRegisterDefaultMutexProvider();
    this.deamonApp.db.on('afterClose', async () => {
      this.deamonApp.off('beforeStart', this.onBeforeStart);
      this.deamonApp = null;
      for (const mutexProvider of this.mutexProviders.values()) {
        await mutexProvider.close();
      }
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

  private getMutex(name: string): Mutex {
    if (!this.mutexes.has(name)) {
      this.mutexes.set(name, new Mutex());
    }
    return this.mutexes.get(name)!;
  }

  public async runExclusive(name: string, fn: () => Promise<any>, config?: MutexConfig): Promise<any> {
    if (!name) {
      throw new Error('Mutex name is required');
    }

    const mutex = this.getMutex(name);

    return mutex.runExclusive(async () => {
      const mutexProvider = this.getMutexProvider(config?.type);
      if (mutexProvider) {
        await mutexProvider.acquire(name);
      }

      let fnResult = await fn();

      if (mutexProvider) {
        await mutexProvider.release(name);
      }

      return fnResult;
    });
  }

  public async runExclusiveWithSingleMutex(name: string, fn: () => Promise<any>, config?: MutexConfig): Promise<any> {
    if (!name) {
      throw new Error('Mutex name is required');
    }

    let fnResult = null;

    const mutexProvider = this.getMutexProvider(config?.type);
    if (mutexProvider) {
      await mutexProvider.acquire(name);
      fnResult = await fn();
      await mutexProvider.release(name);
    } else {
      const mutex = this.getMutex(name);
      fnResult = await mutex.runExclusive(fn);
    }

    return fnResult;
  }

  /**
   * Helper function to generate a mutex name
   * @param config
   * @returns `${db_type}_${db_host}_${db_port}_${db_name}_${table_name}_${other}_${action}`
   */
  public static nameHelper(config: MutexNameHelperConfig): string {
    const prefix = 'mutex_manager:';
    if (config.db_storage) {
      config.db_storage = _.last(_.split(config.db_storage, '/'));
      config.db_storage = _.last(_.split(config.db_storage, '\\')); // for windows
    }

    let name = `${prefix}${config.db_dialect ?? ''}_${config.db_host ?? ''}_${config.db_port ?? ''}_${
      config.db_storage ?? ''
    }_${config.db_name ?? ''}_${config.table_name ?? ''}_${config.other ?? ''}_${config.action ?? ''}`;

    name = name.replace(/_+/g, '_');
    name = name.replace(/_$/, '');

    console.log(`Mutex name: ${name}`);

    return name;
  }
}
