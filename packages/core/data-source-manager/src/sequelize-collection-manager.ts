/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/* istanbul ignore file -- @preserve */

import { Database } from '@nocobase/database';
import { DataSource } from './data-source';
import {
  CollectionOptions,
  ICollection,
  ICollectionManager,
  IFieldInterface,
  IRepository,
  MergeOptions,
} from './types';

export class SequelizeCollectionManager implements ICollectionManager {
  db: Database;
  options: any;
  dataSource: DataSource;

  constructor(options) {
    this.db = this.createDB(options);
    this.options = options;
  }

  setDataSource(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  collectionsFilter() {
    if (this.options.collectionsFilter) {
      return this.options.collectionsFilter;
    }

    return (collection) => {
      return collection.options.introspected;
    };
  }

  createDB(options: any = {}) {
    if (options.database instanceof Database) {
      return options.database;
    }

    return new Database(options);
  }

  registerFieldTypes(types: Record<string, any>) {
    this.db.registerFieldTypes(types);
  }

  registerFieldInterfaces() {}

  registerCollectionTemplates() {}

  registerModels(models: Record<string, any>) {
    return this.db.registerModels(models);
  }

  registerRepositories(repositories: Record<string, any>) {
    return this.db.registerModels(repositories);
  }

  getRegisteredRepository(key: any) {
    if (typeof key !== 'string') {
      return key;
    }
    return this.db.repositories.get(key);
  }

  defineCollection(options: CollectionOptions) {
    const collection = this.db.collection(options);
    // @ts-ignore
    collection.model.refreshAttributes();

    // @ts-ignore
    collection.model._findAutoIncrementAttribute();
    return collection;
  }

  extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ICollection {
    return this.db.extendCollection(collectionOptions, mergeOptions) as unknown as ICollection;
  }

  hasCollection(name: string) {
    return this.db.hasCollection(name);
  }

  getCollection(name: string) {
    return this.db.getCollection(name);
  }

  removeCollection(name: string) {
    this.db.removeCollection(name);
  }

  getCollections() {
    const collectionsFilter = this.collectionsFilter();

    return [...this.db.collections.values()].filter((collection) => collectionsFilter(collection));
  }

  getRepository<R = IRepository>(name: string, sourceId?: string | number): R {
    return this.db.getRepository(name, sourceId) as R;
  }

  async sync() {
    await this.db.sync();
  }

  registerFieldInterface(name: string, fieldInterface: new (options: any) => IFieldInterface): void {
    this.db.interfaceManager.registerInterfaceType(name, fieldInterface);
  }

  getFieldInterface(name: string): { new (options: any): IFieldInterface | undefined } {
    return this.db.interfaceManager.getInterfaceType(name);
  }
}
