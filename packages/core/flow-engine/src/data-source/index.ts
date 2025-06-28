/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable } from '@formily/reactive';
import { FlowEngine } from '../flowEngine';

export interface DataSourceOptions extends Record<string, any> {
  key: string;
  displayName?: string;
  description?: string;
  [key: string]: any;
}

export class DataSourceManager {
  dataSources: Map<string, DataSource>;
  flowEngine: FlowEngine;

  constructor() {
    this.dataSources = observable.shallow<Map<string, DataSource>>(new Map());
  }

  setFlowEngine(flowEngine: FlowEngine) {
    this.flowEngine = flowEngine;
  }

  addDataSource(ds: DataSource | DataSourceOptions) {
    if (this.dataSources.has(ds.key)) {
      throw new Error(`DataSource with name ${ds.key} already exists`);
    }
    if (ds instanceof DataSource) {
      this.dataSources.set(ds.key, ds);
    } else {
      const clz = ds.use || DataSource;
      ds = new clz(ds);
      this.dataSources.set(ds.key, ds as DataSource);
    }
    ds.setDataSourceManager(this);
  }

  upsertDataSource(ds: DataSource | DataSourceOptions) {
    if (this.dataSources.has(ds.key)) {
      this.dataSources.get(ds.key)?.setOptions(ds);
    } else {
      this.addDataSource(ds);
    }
  }

  removeDataSource(key: string) {
    this.dataSources.delete(key);
  }

  clearDataSources() {
    this.dataSources.clear();
  }

  getDataSources(): DataSource[] {
    return Array.from(this.dataSources.values());
  }

  getDataSource(key: string): DataSource | undefined {
    return this.dataSources.get(key);
  }

  getCollection(dataSourceKey: string, collectionName: string): Collection | undefined {
    const ds = this.getDataSource(dataSourceKey);
    if (!ds) return undefined;
    return ds.collectionManager.getCollection(collectionName);
  }

  getCollectionField(fieldPathWithDataSource: string) {
    const [dataSourceKey, ...otherKeys] = fieldPathWithDataSource.split('.');
    const ds = this.getDataSource(dataSourceKey);
    if (!ds) return undefined;
    return ds.getCollectionField(otherKeys.join('.'));
  }
}

export class DataSource {
  dataSourceManager: DataSourceManager;
  collectionManager: CollectionManager;
  options: Record<string, any>;

  constructor(options: Record<string, any> = {}) {
    this.options = observable({ ...options });
    this.collectionManager = new CollectionManager(this);
  }

  get flowEngine() {
    return this.dataSourceManager.flowEngine;
  }

  get displayName() {
    return this.options.displayName ? this.flowEngine?.translate(this.options.displayName) : this.key;
  }

  get key() {
    return this.options.key;
  }

  get name() {
    return this.options.key;
  }

  setDataSourceManager(dataSourceManager: DataSourceManager) {
    this.dataSourceManager = dataSourceManager;
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

  upsertCollection(options: CollectionOptions) {
    return this.collectionManager.upsertCollection(options);
  }

  upsertCollections(collections: CollectionOptions[]) {
    return this.collectionManager.upsertCollections(collections);
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
      throw new Error(`Collection ${collectionName} not found in data source ${this.key}`);
    }
    const field = collection.getField(fieldName);
    if (!field) {
      return;
    }
    return field;
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

  constructor(public dataSource: DataSource) {
    this.collections = observable.shallow<Map<string, Collection>>(new Map());
  }

  get flowEngine() {
    return this.dataSource.flowEngine;
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

  upsertCollection(options: CollectionOptions) {
    if (this.collections.has(options.name)) {
      this.updateCollection(options);
    } else {
      this.addCollection(options);
    }
    return this.getCollection(options.name);
  }

  upsertCollections(collections: CollectionOptions[]) {
    for (const collection of collections) {
      if (this.collections.has(collection.name)) {
        this.updateCollection(collection);
      } else {
        this.addCollection(collection);
      }
    }
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
  fields: Map<string, CollectionField>;
  options: Record<string, any>;
  inherits: Map<string, Collection>;
  dataSource: DataSource;

  constructor(options: Record<string, any> = {}) {
    this.options = observable({ ...options });
    this.fields = observable.shallow<Map<string, CollectionField>>(new Map());
    this.inherits = observable.shallow<Map<string, Collection>>(new Map());
    this.setFields(options.fields || []);
  }

  get flowEngine() {
    return this.dataSource.flowEngine;
  }

  get collectionManager() {
    return this.dataSource.collectionManager;
  }

  get filterTargetKey() {
    return this.options.filterTargetKey;
  }

  get dataSourceKey() {
    return this.dataSource.key;
  }

  get name() {
    return this.options.name;
  }

  get title() {
    return this.options.title ? this.flowEngine?.translate(this.options.title) : this.name;
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
    this.upsertFields(this.options.fields || []);
  }

  getFields(): CollectionField[] {
    // 合并自身 fields 和所有 inherits 的 fields，后者优先被覆盖
    const fieldMap = new Map<string, CollectionField>();
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

  mapFields(callback: (field: CollectionField) => any): any[] {
    return this.getFields().map(callback);
  }

  setFields(fields: CollectionField[] | Record<string, any>[]) {
    this.fields.clear();
    for (const field of fields) {
      this.addField(field);
    }
  }

  upsertFields(fields: Record<string, any>[] = []) {
    for (const field of fields) {
      if (this.fields.has(field.name)) {
        this.fields.get(field.name).setOptions(field);
      } else {
        this.addField(field);
      }
    }
  }

  getField(fieldName: string): CollectionField | undefined {
    return this.fields.get(fieldName);
  }

  getFullFieldPath(name: string): string {
    return this.dataSource.key + '.' + this.name + '.' + name;
  }

  addField(field: CollectionField | Record<string, any>) {
    if (field.name && this.fields.has(field.name)) {
      throw new Error(`Field with name ${field.name} already exists in collection ${this.name}`);
    }
    if (field instanceof CollectionField) {
      field.setCollection(this);
      this.fields.set(field.name, field);
    } else {
      const newField = new CollectionField(field);
      newField.setCollection(this);
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

export class CollectionField {
  options: Record<string, any>;
  collection: Collection;

  constructor(options: Record<string, any>) {
    this.options = observable({ ...options });
  }

  setOptions(newOptions: any = {}) {
    Object.keys(this.options).forEach((key) => delete this.options[key]);
    Object.assign(this.options, newOptions);
  }

  setCollection(collection: Collection) {
    this.collection = collection;
  }

  get flowEngine() {
    return this.collection.flowEngine;
  }

  get dataSourceKey() {
    return this.collection.dataSourceKey;
  }

  get fullpath() {
    return this.collection.dataSource.key + '.' + this.collection.name + '.' + this.name;
  }

  get name() {
    return this.options.name;
  }

  get type() {
    return this.options.type;
  }

  get target() {
    return this.options.target;
  }

  get title() {
    const titleValue = this.options?.title || this.options?.uiSchema?.title || this.options.name;
    return this.flowEngine?.translate(titleValue);
  }

  set title(value: string) {
    this.options.title = value;
  }

  get enum(): any[] {
    return this.options.uiSchema?.enum || [];
  }

  get interface() {
    return this.options.interface || 'input';
  }

  get filterable() {
    return this.options.filterable;
  }

  get uiSchema() {
    return this.options.uiSchema || {};
  }

  getComponentProps() {
    return this.options.uiSchema?.['x-component-props'] || {};
  }

  getFields(): CollectionField[] {
    if (!this.options.target) {
      return [];
    }
    const targetCollection = this.collection.collectionManager.getCollection(this.options.target);
    if (!targetCollection) {
      throw new Error(`Target collection ${this.options.target} not found for field ${this.name}`);
    }
    return targetCollection.getFields();
  }

  getInterfaceOptions() {
    const app = this.flowEngine.context.app;
    return app.dataSourceManager.collectionFieldInterfaceManager.getFieldInterface(this.interface);
  }
}
