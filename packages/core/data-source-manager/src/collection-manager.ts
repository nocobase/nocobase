/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection } from './collection';
import { DataSource } from './data-source';
import { Repository } from './repository';
import {
  CollectionOptions,
  ICollection,
  ICollectionManager,
  IFieldInterface,
  IRepository,
  MergeOptions,
} from './types';

export class CollectionManager implements ICollectionManager {
  public dataSource: DataSource;
  protected collections = new Map<string, ICollection>();
  protected repositories = new Map<string, IRepository>();
  protected models = new Map<string, any>();

  constructor(options: any = {}) {
    if (options.dataSource) {
      this.dataSource = options.dataSource;
    }

    this.registerRepositories({
      Repository: Repository,
    });
  }

  setDataSource(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  /* istanbul ignore next -- @preserve */
  getRegisteredFieldType(type) {}

  /* istanbul ignore next -- @preserve */
  getRegisteredFieldInterface(key: string) {}

  /* istanbul ignore next -- @preserve */
  getRegisteredModel(key: string) {
    return this.models.get(key);
  }

  getRegisteredRepository(key: any) {
    if (typeof key !== 'string') {
      return key;
    }
    return this.repositories.get(key);
  }

  /* istanbul ignore next -- @preserve */
  registerFieldTypes() {}

  registerFieldInterfaces(interfaces: Record<string, new (options: any) => IFieldInterface>) {
    Object.keys(interfaces).forEach((key) => {
      this.registerFieldInterface(key, interfaces[key]);
    });
  }

  registerFieldInterface(name: string, fieldInterface: new (options: any) => IFieldInterface): void {}

  getFieldInterface(name: string): { new (options: any): IFieldInterface | undefined } {
    return;
  }

  /* istanbul ignore next -- @preserve */
  registerCollectionTemplates() {}

  registerModels(models: Record<string, any>) {
    Object.keys(models).forEach((key) => {
      this.models.set(key, models[key]);
    });
  }

  registerRepositories(repositories: Record<string, any>) {
    Object.keys(repositories).forEach((key) => {
      this.repositories.set(key, repositories[key]);
    });
  }

  defineCollection(options: CollectionOptions): ICollection {
    const collection = this.newCollection(options);
    this.collections.set(options.name, collection);
    return collection;
  }

  extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ICollection {
    const collection = this.getCollection(collectionOptions.name);
    collection.updateOptions(collectionOptions, mergeOptions);
    return collection;
  }

  hasCollection(name: string) {
    return !!this.getCollection(name);
  }

  getCollection(name: string) {
    return this.collections.get(name);
  }

  getCollections(): Array<ICollection> {
    return [...this.collections.values()];
  }

  getRepository(name: string, sourceId?: string | number): IRepository {
    const collection = this.getCollection(name);
    return collection.repository;
  }

  async sync() {}

  removeCollection(name: string): void {
    this.collections.delete(name);
  }

  protected newCollection(options): ICollection {
    // @ts-ignore
    return new Collection(options, this);
  }
}
