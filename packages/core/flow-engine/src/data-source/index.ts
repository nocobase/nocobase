/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable } from '@formily/reactive';

export interface DataSourceOptions extends Record<string, any> {
  name: string;
  use?: typeof DataSource;
  displayName?: string;
  description?: string;
  [key: string]: any;
}

export class DataSourceManager {
  dataSources: Map<string, DataSource>;

  constructor() {
    this.dataSources = observable.shallow<Map<string, DataSource>>(new Map());
  }

  addDataSource(ds: DataSource | DataSourceOptions) {
    if (this.dataSources.has(ds.name)) {
      throw new Error(`DataSource with name ${ds.name} already exists`);
    }
    if (ds instanceof DataSource) {
      this.dataSources.set(ds.name, ds);
    } else {
      const clz = ds.use || DataSource;
      this.dataSources.set(ds.name, new clz(ds));
    }
  }

  removeDataSource(name: string) {
    this.dataSources.delete(name);
  }

  getDataSource(name: string): DataSource | undefined {
    return this.dataSources.get(name);
  }

  getCollection(dataSourceName: string, collectionName: string): Collection | undefined {
    const ds = this.getDataSource(dataSourceName);
    if (!ds) return undefined;
    return ds.collectionManager.getCollection(collectionName);
  }
}

export class DataSource {
  collectionManager: CollectionManager;
  options: Record<string, any>;

  constructor(options: Record<string, any> = {}) {
    this.options = observable({ ...options });
    this.collectionManager = new CollectionManager();
  }

  get name() {
    return this.options.name;
  }

  setOptions(newOptions: any = {}) {
    Object.keys(this.options).forEach((key) => delete this.options[key]);
    Object.assign(this.options, newOptions);
  }

  refresh() {
    // 刷新数据源
  }
}

export class CollectionManager {
  collections: Map<string, Collection>;

  constructor() {
    this.collections = observable.shallow<Map<string, Collection>>(new Map());
  }

  addCollection(collection: Collection) {
    collection.setCollectionManager(this);
    collection.initInherits();
    this.collections.set(collection.name, collection);
  }

  removeCollection(name: string) {
    this.collections.delete(name);
  }

  getCollection(name: string): Collection | undefined {
    return this.collections.get(name);
  }
}

// Collection 负责管理自己的 Field
export class Collection {
  fields: Map<string, Field>;
  options: Record<string, any>;
  inherits: Map<string, Collection>;
  collectionManager: CollectionManager;

  constructor(options: Record<string, any> = {}) {
    this.options = observable({ ...options });
    this.fields = observable.shallow<Map<string, Field>>(new Map());
    this.inherits = observable.shallow<Map<string, Collection>>(new Map());
  }

  get name() {
    return this.options.name;
  }

  initInherits() {
    this.inherits.clear();
    for (const inherit of this.options.inherits || []) {
      const collection = this.collectionManager.getCollection(inherit);
      if (!collection) {
        throw new Error(`Collection ${inherit} not found`);
      }
      this.inherits.set(inherit, collection);
    }
  }

  setCollectionManager(collectionManager: CollectionManager) {
    this.collectionManager = collectionManager;
  }

  setOptions(newOptions: any = {}) {
    Object.keys(this.options).forEach((key) => delete this.options[key]);
    Object.assign(this.options, newOptions);
    this.initInherits();
  }

  getFields(): Field[] {
    // 合并自身 fields 和所有 inherits 的 fields，后者优先被覆盖
    const fieldMap = new Map<string, Field>();
    for (const inherit of this.inherits.values()) {
      if (inherit && typeof inherit.getFields === 'function') {
        for (const field of inherit.getFields()) {
          fieldMap.set(field.name, field);
        }
      }
    }
    // 自身 fields 覆盖同名
    for (const [name, field] of this.fields.entries()) {
      fieldMap.set(name, field);
    }
    return Array.from(fieldMap.values());
  }

  addField(field: Field) {
    this.fields.set(field.name, field);
  }

  removeField(fieldName: string) {
    this.fields.delete(fieldName);
  }

  refresh() {
    // 刷新集合
  }
}

export class Field {
  options: Record<string, any>;

  constructor(options: Record<string, any>) {
    this.options = observable({ ...options });
  }

  setOptions(newOptions: any = {}) {
    Object.keys(this.options).forEach((key) => delete this.options[key]);
    Object.assign(this.options, newOptions);
  }

  get name() {
    return this.options.name;
  }

  get type() {
    return this.options.type;
  }
}
