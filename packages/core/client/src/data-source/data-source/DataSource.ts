import type { CollectionOptions } from '../collection';
import type { DataSourceManager } from './DataSourceManager';

import { CollectionManager } from '../collection';

type LoadCallback = (collections: CollectionOptions[]) => void;

export interface DataSourceOptions {
  key: string;
  displayName: string;
  collections?: CollectionOptions[];
  errorMessage?: string;
  status?: 'loaded' | 'loading-failed' | 'loading' | 'reloading';
  isDBInstance?: boolean;
}

export type DataSourceFactory = new (options: DataSourceOptions, dataSourceManager: DataSourceManager) => DataSource;

export abstract class DataSource {
  collectionManager: CollectionManager;
  protected reloadCallbacks: LoadCallback[] = [];

  constructor(
    protected options: DataSourceOptions,
    public dataSourceManager: DataSourceManager,
  ) {
    this.collectionManager = new CollectionManager(options.collections, this);
  }

  get app() {
    return this.dataSourceManager.app;
  }

  get key() {
    return this.options.key;
  }

  get displayName() {
    return this.options.displayName;
  }

  get status() {
    return this.options.status;
  }

  get errorMessage() {
    return this.options.errorMessage;
  }

  get collections() {
    return this.collectionManager.getCollections() || [];
  }

  getOptions() {
    return this.options;
  }

  setOptions(options: Partial<DataSourceOptions>) {
    Object.assign(this.options, options);
  }

  getOption<Key extends keyof DataSourceOptions>(key: Key): DataSourceOptions[Key] {
    return this.options[key];
  }

  addReloadCallback(callback: LoadCallback) {
    if (this.reloadCallbacks.includes(callback)) return;
    this.reloadCallbacks.push(callback);
  }

  removeReloadCallback(callback: LoadCallback) {
    this.reloadCallbacks = this.reloadCallbacks.filter((cb) => cb !== callback);
  }

  abstract getDataSource(): Promise<Omit<Partial<DataSourceOptions>, 'key'>> | Omit<Partial<DataSourceOptions>, 'key'>;

  async reload() {
    const dataSource = await this.getDataSource();
    this.setOptions(dataSource);
    this.collectionManager.setCollections(dataSource.collections || []);
    this.reloadCallbacks.forEach((callback) => callback(dataSource.collections));
    return this.options;
  }
}

/**
 * @internal
 */
export class LocalDataSource extends DataSource {
  getDataSource() {
    return {
      collections: this.collections,
    };
  }
}
