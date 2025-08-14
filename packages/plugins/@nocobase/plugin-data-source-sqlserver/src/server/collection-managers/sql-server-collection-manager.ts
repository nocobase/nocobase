/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  CollectionOptions,
  DataSource,
  ICollection,
  ICollectionManager,
  IFieldInterface,
  IRepository,
  MergeOptions,
} from '@nocobase/data-source-manager';
import { SqlServerRepository } from '../repositories/sql-server-repository';
import { mapDataType } from '../utils/map-data-types';

export class SqlServerCollectionManager implements ICollectionManager {
  collections = new Map<string, ICollection>();
  repositories = new Map<string, IRepository>();

  dataSource: DataSource;
  setDataSource(dataSource: DataSource): void {
    this.dataSource = dataSource;
  }
  registerFieldTypes(types: Record<string, any>): void {
    //
  }
  registerFieldInterfaces(interfaces: Record<string, new (options: any) => IFieldInterface>): void {
    //
  }
  registerFieldInterface(name: string, fieldInterface: new (options: any) => IFieldInterface): void {
    //
  }
  getFieldInterface(name: string): new (options: any) => IFieldInterface {
    return undefined;
  }
  registerCollectionTemplates(templates: Record<string, any>): void {
    //
  }
  registerModels(models: Record<string, any>): void {
    //
  }
  registerRepositories(repositories: Record<string, new (collection: ICollection) => IRepository>): void {
    //
  }
  getRegisteredRepository(key: string): new (collection: ICollection) => IRepository {
    return undefined;
  }
  defineCollection(options: CollectionOptions): ICollection {
    const { name } = options;
    if (this.collections.has(name)) {
      throw new Error(`Collection ${name} already exists`);
    }
    const collection = {
      name,
      options,
    } as ICollection;
    this.collections.set(name, collection);
    return collection;
  }
  extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ICollection {
    const { name } = collectionOptions;
    const collection = this.collections.get(name);
    if (!collection) {
      throw new Error(`Collection ${name} does not exist`);
    }
    collection.options = { ...collection.options, ...collectionOptions };
    return collection;
  }
  hasCollection(name: string): boolean {
    return this.collections.has(name);
  }
  getCollection(name: string): ICollection {
    return this.collections.get(name);
  }
  getCollections(): ICollection[] {
    return Array.from(this.collections.values());
  }
  removeCollection(name: string): void {
    this.collections.delete(name);
  }
  getRepository(name: string, sourceId?: string | number): IRepository {
    if (this.repositories.has(name)) {
      return this.repositories.get(name);
    }
    const collection = this.getCollection(name);
    const repository = new SqlServerRepository(collection, this);
    this.repositories.set(name, repository);
    return repository;
  }
  async sync(): Promise<void> {
    const tables = await (this.dataSource as any).getTables();
    for (const tableName of tables) {
      const columns = await (this.dataSource as any).getColumns(tableName);
      const fields = columns.map((column) => ({
        name: column.column_name,
        type: mapDataType(column.data_type),
        rawType: column.data_type,
      }));
      if (this.hasCollection(tableName)) {
        this.extendCollection({ name: tableName, fields });
      } else {
        this.defineCollection({ name: tableName, fields });
      }
    }
  }
}
