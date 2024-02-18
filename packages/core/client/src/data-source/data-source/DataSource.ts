import type { CollectionOptionsV2 } from '../collection';
import type { DataSourceManagerV2 } from './DataSourceManager';

import { CollectionManagerV2 } from '../collection';

type LoadCallback = (collections: CollectionOptionsV2[]) => void;

export interface DataSourceOptionsV2 {
  key: string;
  displayName: string;
  collections?: CollectionOptionsV2[];
  errorMessage?: string;
  status?: 'loaded' | 'loading-failed' | 'loading' | 'reloading';
}

export type DataSourceFactory = new (
  options: DataSourceOptionsV2,
  dataSourceManager: DataSourceManagerV2,
) => DataSourceV2;

export abstract class DataSourceV2 {
  collectionManager: CollectionManagerV2;
  protected reloadCallbacks: LoadCallback[] = [];

  constructor(
    protected options: DataSourceOptionsV2,
    public dataSourceManager: DataSourceManagerV2,
  ) {
    this.collectionManager = new CollectionManagerV2(options.collections, this);
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

  setOptions(options: Partial<DataSourceOptionsV2>) {
    Object.assign(this.options, options);
  }

  getOption<Key extends keyof DataSourceOptionsV2>(key: Key): DataSourceOptionsV2[Key] {
    return this.options[key];
  }

  addReloadCallback(callback: LoadCallback) {
    if (this.reloadCallbacks.includes(callback)) return;
    this.reloadCallbacks.push(callback);
  }

  removeReloadCallback(callback: LoadCallback) {
    this.reloadCallbacks = this.reloadCallbacks.filter((cb) => cb !== callback);
  }

  abstract getDataSource():
    | Promise<Omit<Partial<DataSourceOptionsV2>, 'key'>>
    | Omit<Partial<DataSourceOptionsV2>, 'key'>;

  async reload() {
    const dataSource = await this.getDataSource();
    this.setOptions(dataSource);
    this.collectionManager.setCollections(dataSource.collections || []);
    this.reloadCallbacks.forEach((callback) => callback(dataSource.collections));
    return this.options;
  }
}

export class LocalDataSource extends DataSourceV2 {
  getDataSource() {
    return {
      collections: this.collections,
    };
  }
}
