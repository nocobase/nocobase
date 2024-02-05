import type { CollectionOptionsV2 } from '../collection';
import type { DataSourceManagerV2 } from './DataSourceManager';

import { CollectionManagerV2 } from '../collection';

type LoadCallback = (collections: CollectionOptionsV2[]) => void;

export interface DataSourceOptionsV2 {
  key: string;
  displayName: string;
  collections?: CollectionOptionsV2[];
  errorMessage?: string;
  status?: 'loaded' | 'failed' | 'loading';
}

export type DataSourceFactory = new (
  options: DataSourceOptionsV2,
  dataSourceManager: DataSourceManagerV2,
) => DataSourceV2;

export abstract class DataSourceV2 {
  collectionManager: CollectionManagerV2;
  reloadCallback?: LoadCallback;

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

  setOptions(options: DataSourceOptionsV2) {
    this.options = options;
  }

  getOption<Key extends keyof DataSourceOptionsV2>(key: Key): DataSourceOptionsV2[Key] {
    return this.options[key];
  }

  addCollections(collections: CollectionOptionsV2[]) {
    this.collectionManager.addCollections(collections);
  }

  setCollections(collections: CollectionOptionsV2[]) {
    this.collectionManager.setCollections(collections);
  }

  setReloadCallback(callback: LoadCallback) {
    this.reloadCallback = callback;
  }

  abstract getRemoteCollections(): Promise<CollectionOptionsV2[]> | CollectionOptionsV2[];

  // abstract load(callback?: LoadCallback): void | Promise<void>;

  // abstract reload(callback?: LoadCallback): void | Promise<void>;
  async reload() {
    const collections = await this.getRemoteCollections();
    this.setCollections(collections);
    this.reloadCallback && this.reloadCallback(collections);
    return collections;
  }
}

export class LocalDataSource extends DataSourceV2 {
  getRemoteCollections() {
    return this.collections;
  }
}
