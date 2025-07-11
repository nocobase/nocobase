/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable } from '@formily/reactive';
import _ from 'lodash';
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
    return this.options.displayName ? this.flowEngine.translate(this.options.displayName) : this.key;
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
    for (const collection of this.sortCollectionsByInherits(collections)) {
      if (this.collections.has(collection.name)) {
        this.updateCollection(collection);
      } else {
        this.addCollection(collection);
      }
    }
  }

  sortCollectionsByInherits(collections: CollectionOptions[]): CollectionOptions[] {
    // 1. 构建 name -> CollectionOptions 映射
    const map = new Map<string, CollectionOptions>();
    for (const col of collections) {
      map.set(col.name, col);
    }

    // 2. 构建依赖图和入度表
    const graph: Record<string, Set<string>> = {};
    const inDegree: Record<string, number> = {};
    for (const col of collections) {
      graph[col.name] = new Set();
      inDegree[col.name] = 0;
    }
    for (const col of collections) {
      const inherits = col.inherits || [];
      for (const parent of inherits) {
        if (!graph[parent]) graph[parent] = new Set();
        graph[parent].add(col.name);
        inDegree[col.name] = (inDegree[col.name] || 0) + 1;
      }
    }

    // 3. Kahn 算法拓扑排序
    const queue: string[] = [];
    for (const name in inDegree) {
      if (inDegree[name] === 0) queue.push(name);
    }

    const result: CollectionOptions[] = [];
    while (queue.length) {
      const curr = queue.shift();
      if (map.has(curr)) {
        result.push(map.get(curr));
      }
      for (const child of graph[curr] || []) {
        inDegree[child]--;
        if (inDegree[child] === 0) queue.push(child);
      }
    }

    // 4. 检查是否有环
    if (result.length !== collections.length) {
      throw new Error('Collection inherits has circular dependency!');
    }

    return result;
  }

  getCollection(name: string): Collection | undefined {
    if (name.includes('.')) {
      const [collectionName, fieldName] = name.split('.');
      const collection = this.getCollection(collectionName);
      if (!collection) {
        throw new Error(`Collection ${collectionName} not found in data source ${this.dataSource.key}`);
      }
      const field = collection.getField(fieldName);
      if (!field) {
        throw new Error(`Field ${fieldName} not found in collection ${collectionName}`);
      }
      return field.targetCollection;
    }
    return this.collections.get(name);
  }

  getCollections(): Collection[] {
    return _.sortBy(Array.from(this.collections.values()), 'sort');
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

  getFilterByTK(record) {
    if (!record) {
      throw new Error('Record is required to get filterByTk');
    }
    if (Array.isArray(record)) {
      return record.map((r) => this.getFilterByTK(r));
    }
    if (!this.filterTargetKey) {
      throw new Error(`filterTargetKey is not defined for collection ${this.name}`);
    }
    if (typeof this.filterTargetKey === 'string') {
      return record[this.filterTargetKey];
    }
    return _.pick(record, this.filterTargetKey);
  }

  get flowEngine() {
    return this.dataSource.flowEngine;
  }

  get collectionManager() {
    return this.dataSource.collectionManager;
  }

  get sort() {
    return this.options.sort || 0;
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
    return this.options.title ? this.flowEngine.translate(this.options.title) : this.name;
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

  /**
   * 获取所有关联字段
   * @returns 关联字段数组
   */
  getRelationshipFields(): CollectionField[] {
    const relationshipInterfaces = [
      'o2o',
      'oho',
      'obo',
      'm2o',
      'createdBy',
      'updatedBy',
      'o2m',
      'm2m',
      'linkTo',
      'chinaRegion',
      'mbm',
    ];
    return this.getFields().filter((field) => relationshipInterfaces.includes(field.interface));
  }

  /**
   * 获取所有关联的集合
   * @returns 关联集合数组
   */
  getRelatedCollections(): Collection[] {
    const relationshipFields = this.getRelationshipFields();
    const relatedCollections: Collection[] = [];
    const addedCollectionNames = new Set<string>();

    for (const field of relationshipFields) {
      if (field.target && !addedCollectionNames.has(field.target)) {
        const targetCollection = this.collectionManager.getCollection(field.target);
        if (targetCollection && targetCollection.name !== this.name) {
          relatedCollections.push(targetCollection);
          addedCollectionNames.add(field.target);
        }
      }
    }

    return relatedCollections;
  }

  /**
   * 检查是否有关联字段
   * @returns 是否有关联字段
   */
  hasRelationshipFields(): boolean {
    return this.getRelationshipFields().length > 0;
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

  get readonly() {
    return this.options.readonly || this.options.uiSchema?.['x-read-pretty'] || false;
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

  get dataType() {
    return this.options.dataType;
  }

  get foreignKey() {
    return this.options.foreignKey;
  }

  get targetKey() {
    return this.options.targetKey || this.targetCollection.filterTargetKey;
  }

  get sourceKey() {
    return this.options.sourceKey;
  }

  get target() {
    return this.options.target;
  }

  get title() {
    const titleValue = this.options?.title || this.options?.uiSchema?.title || this.options.name;
    return this.flowEngine.translate(titleValue);
  }

  set title(value: string) {
    this.options.title = value;
  }

  get enum(): any[] {
    return this.options.uiSchema?.enum || [];
  }

  get defaultValue() {
    return this.options.defaultValue;
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

  get targetCollection() {
    return this.collection.collectionManager.getCollection(this.options.target);
  }

  getComponentProps() {
    return this.options.uiSchema?.['x-component-props'] || {};
  }

  getFields(): CollectionField[] {
    if (!this.options.target) {
      return [];
    }
    if (!this.targetCollection) {
      throw new Error(`Target collection ${this.options.target} not found for field ${this.name}`);
    }
    return this.targetCollection.getFields();
  }

  getInterfaceOptions() {
    const app = this.flowEngine.getContext('app');
    return app.dataSourceManager.collectionFieldInterfaceManager.getFieldInterface(this.interface);
  }

  getSubclassesOf(baseClass: string) {
    return this.flowEngine.getSubclassesOf(baseClass, (M, name) => {
      return isFieldInterfaceMatch(M['supportedFieldInterfaces'], this.interface);
    });
  }

  getFirstSubclassNameOf(baseClass: string) {
    const subclasses = this.getSubclassesOf(baseClass);
    for (const [name, M] of subclasses) {
      if (M['supportedFieldInterfaces'] !== '*') {
        return name;
      }
    }
    return undefined;
  }

  /**
   * 检查字段是否为关联字段
   * @returns 是否为关联字段
   */
  isRelationshipField(): boolean {
    const relationshipInterfaces = [
      'o2o',
      'oho',
      'obo',
      'm2o',
      'createdBy',
      'updatedBy',
      'o2m',
      'm2m',
      'linkTo',
      'chinaRegion',
      'mbm',
    ];
    return relationshipInterfaces.includes(this.interface);
  }
}

/**
 * 判断 fieldInterfaces 是否匹配 targetInterface
 * @param fieldInterfaces string | string[] | null
 * @param targetInterface string
 */
export function isFieldInterfaceMatch(
  fieldInterfaces: string | string[] | null | undefined,
  targetInterface: string,
): boolean {
  if (!fieldInterfaces) return false;
  if (fieldInterfaces === '*') return true;
  if (typeof fieldInterfaces === 'string') return fieldInterfaces === targetInterface;
  if (Array.isArray(fieldInterfaces)) {
    return fieldInterfaces.includes('*') || fieldInterfaces.includes(targetInterface);
  }
  return false;
}
