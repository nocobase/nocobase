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

  clearDataSources() {
    this.dataSources.clear();
  }

  getDataSources(): DataSource[] {
    return Array.from(this.dataSources.values());
  }

  getDataSource(name: string): DataSource | undefined {
    return this.dataSources.get(name);
  }

  getCollection(dataSourceName: string, collectionName: string): Collection | undefined {
    const ds = this.getDataSource(dataSourceName);
    if (!ds) return undefined;
    return ds.collectionManager.getCollection(collectionName);
  }

  getCollectionField(fieldPathWithDataSource: string) {
    const [dataSourceName, ...otherKeys] = fieldPathWithDataSource.split('.');
    const ds = this.getDataSource(dataSourceName);
    if (!ds) return undefined;
    return ds.getCollectionField(otherKeys.join('.'));
  }
}

export class DataSource {
  collectionManager: CollectionManager;
  options: Record<string, any>;

  constructor(options: Record<string, any> = {}) {
    this.options = observable({ ...options });
    this.collectionManager = new CollectionManager(this);
  }

  get name() {
    return this.options.name;
  }

  getCollections(): Collection[] {
    return this.collectionManager.getCollections();
  }

  getCollection(name: string): Collection | undefined {
    return this.collectionManager.getCollection(name);
  }

  addCollection(collection: Collection | CollectionOptions) {
    return this.collectionManager.addCollection(collection);
  }

  updateCollection(newOptions: CollectionOptions) {
    return this.collectionManager.updateCollection(newOptions);
  }

  removeCollection(name: string) {
    return this.collectionManager.removeCollection(name);
  }

  clearCollections() {
    this.collectionManager.clearCollections();
  }

  setOptions(newOptions: any = {}) {
    Object.keys(this.options).forEach((key) => delete this.options[key]);
    Object.assign(this.options, newOptions);
  }

  getCollectionField(fieldPath: string) {
    const [collectionName, ...otherKeys] = fieldPath.split('.');
    const fieldName = otherKeys.join('.');
    const collection = this.getCollection(collectionName);
    if (!collection) {
      throw new Error(`Collection ${collectionName} not found in data source ${this.name}`);
    }
    const field = collection.getField(fieldName);
    if (!field) {
      throw new Error(`Field ${fieldName} not found in collection ${collectionName}`);
    }
    return field;
  }

  refresh() {
    // 刷新数据源
  }
}

export interface CollectionOptions {
  name: string;
  title?: string;
  inherits?: string[];
  [key: string]: any;
}

export class CollectionManager {
  collections: Map<string, Collection>;

  constructor(protected dataSource: DataSource) {
    this.collections = observable.shallow<Map<string, Collection>>(new Map());
  }

  addCollection(collection: Collection | CollectionOptions) {
    let col: Collection;
    if (collection instanceof Collection) {
      col = collection;
    } else {
      col = new Collection(collection);
    }
    col.setDataSource(this.dataSource);
    col.initInherits();
    this.collections.set(col.name, col);
  }

  removeCollection(name: string) {
    this.collections.delete(name);
  }

  updateCollection(newOptions: CollectionOptions) {
    const collection = this.getCollection(newOptions.name);
    if (!collection) {
      throw new Error(`Collection ${newOptions.name} not found`);
    }
    collection.setOptions(newOptions);
  }

  getCollection(name: string): Collection | undefined {
    return this.collections.get(name);
  }

  getCollections(): Collection[] {
    return Array.from(this.collections.values());
  }

  clearCollections() {
    this.collections.clear();
  }
}

// Collection 负责管理自己的 Field
export class Collection {
  fields: Map<string, Field>;
  options: Record<string, any>;
  inherits: Map<string, Collection>;
  dataSource: DataSource;

  constructor(options: Record<string, any> = {}) {
    this.options = observable({ ...options });
    this.fields = observable.shallow<Map<string, Field>>(new Map());
    this.inherits = observable.shallow<Map<string, Collection>>(new Map());
    this.setFields(options.fields || []);
  }

  get collectionManager() {
    return this.dataSource.collectionManager;
  }

  get name() {
    return this.options.name;
  }

  get title() {
    return this.options.title || this.name;
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

  setDataSource(dataSource: DataSource) {
    this.dataSource = dataSource;
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

  mapFields(callback: (field: Field) => any): any[] {
    return this.getFields().map(callback);
  }

  setFields(fields: Field[] | Record<string, any>[]) {
    this.fields.clear();
    for (const field of fields) {
      this.addField(field);
    }
  }

  getField(fieldName: string): Field | undefined {
    return this.fields.get(fieldName);
  }

  addField(field: Field | Record<string, any>) {
    if (field.name && this.fields.has(field.name)) {
      throw new Error(`Field with name ${field.name} already exists in collection ${this.name}`);
    }
    if (field instanceof Field) {
      this.fields.set(field.name, field);
    } else {
      const newField = new Field(field);
      this.fields.set(newField.name, newField);
    }
  }

  removeField(fieldName: string) {
    return this.fields.delete(fieldName);
  }

  clearFields() {
    return this.fields.clear();
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

  get title() {
    return this.options.title;
  }

  set title(value: string) {
    this.options.title = value;
  }
}
