import type { Application } from '../../Application';
import type { CollectionOptionsV3 } from '../collection';
import type { DataSourceManagerV3 } from './DataSourceManager';

import { CollectionManagerV3 } from '../collection';

type LoadCallback = (collections: CollectionOptionsV3[]) => void;

export interface DataSourceOptionsV3 {
  key: string;
  displayName: string;
  collections?: CollectionOptionsV3[];
  errorMessage?: string;
  status?: 'loaded' | 'failed' | 'loading';
}

export type DataSourceFactory = new (
  options: DataSourceOptionsV3,
  app: Application,
  dataSourceManager: DataSourceManagerV3,
) => DataSourceV3;

export abstract class DataSourceV3 {
  collectionManager: CollectionManagerV3;
  reloadCallback?: LoadCallback;

  constructor(
    protected options: DataSourceOptionsV3,
    public app: Application,
    public dataSourceManager: DataSourceManagerV3,
  ) {
    this.collectionManager = new CollectionManagerV3(options.collections, app, dataSourceManager, this);
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
    return this.options.collections || [];
  }

  set collections(collections: CollectionOptionsV3[]) {
    this.options.collections = collections;
    this.addCollections();
  }

  getOptions() {
    return this.options;
  }

  getOption<Key extends keyof DataSourceOptionsV3>(key: Key): DataSourceOptionsV3[Key] {
    return this.options[key];
  }

  addCollections() {
    this.collectionManager.addCollections(this.collections);
    this.reloadCallback && this.reloadCallback(this.collections);
  }

  setReloadCallback(callback: LoadCallback) {
    this.reloadCallback = callback;
  }

  abstract getCollections(): Promise<CollectionOptionsV3[]> | CollectionOptionsV3[];

  // abstract load(callback?: LoadCallback): void | Promise<void>;

  // abstract reload(callback?: LoadCallback): void | Promise<void>;
  async reload() {
    this.collections = await this.getCollections();
    return this.collections;
  }
}

export class LocalDataSource extends DataSourceV3 {
  // load() {
  //   this.addCollections();
  // }
  // async reload() {
  //   this.addCollections();
  // }

  getCollections() {
    return this.collections;
  }
}
