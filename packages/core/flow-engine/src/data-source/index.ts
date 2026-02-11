/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable } from '@formily/reactive';
import { CascaderProps } from 'antd';
import _ from 'lodash';
import { FlowEngine } from '../flowEngine';
import { jioToJoiSchema } from './jioToJoiSchema';
import { sortCollectionsByInherits } from './sortCollectionsByInherits';
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
    return this.flowEngine.translate(this.options.displayName, { ns: 'lm-collections' }) || this.key;
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

  /**
   * @deprecated use getAssociation instead
   */
  getAssocation(associationName: string): CollectionField | undefined {
    return this.getAssociation(associationName);
  }

  getAssociation(associationName: string): CollectionField | undefined {
    return this.collectionManager.getAssociation(associationName);
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

  upsertCollections(collections: CollectionOptions[], options: { clearFields?: boolean } = {}) {
    return this.collectionManager.upsertCollections(collections, options);
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
      return;
    }
    const field = collection.getFieldByPath(fieldName);
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

  allCollectionsInheritChain: string[];
  protected childrenCollectionsName: { supportView?: string[]; notSupportView?: string[] } = {};

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

  updateCollection(newOptions: CollectionOptions, options: { clearFields?: boolean } = {}) {
    const collection = this.getCollection(newOptions.name);
    if (!collection) {
      throw new Error(`Collection ${newOptions.name} not found`);
    }
    collection.setOptions(newOptions, options);
  }

  upsertCollection(options: CollectionOptions) {
    if (this.collections.has(options.name)) {
      this.updateCollection(options);
    } else {
      this.addCollection(options);
    }
    return this.getCollection(options.name);
  }

  upsertCollections(collections: CollectionOptions[], options: { clearFields?: boolean } = {}) {
    for (const collection of sortCollectionsByInherits(collections)) {
      if (this.collections.has(collection.name)) {
        this.updateCollection(collection, options);
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
    return _.sortBy(
      Array.from(this.collections.values()).filter((collection) => !collection.hidden),
      'sort',
    );
  }

  clearCollections() {
    this.collections.clear();
  }

  getAssociation(associationName: string): CollectionField | undefined {
    const [collectionName, fieldName] = associationName.split('.');
    const collection = this.getCollection(collectionName);
    if (!collection) {
      throw new Error(`Collection ${collectionName} not found in data source ${this.dataSource.key}`);
    }
    return collection.getField(fieldName);
  }

  getChildrenCollections(name) {
    const childrens = [];
    const collections = Array.from(this.collections.values());
    const getChildrens = (name) => {
      const inheritCollections = collections.filter((v: any) => {
        return v.options.inherits?.includes(name);
      });
      inheritCollections.forEach((v) => {
        const collectionKey = v.name;
        childrens.push(v);
        return getChildrens(collectionKey);
      });
      return childrens;
    };
    return getChildrens(name);
  }
  getChildrenCollectionsName(name, isSupportView = false) {
    const cacheKey = isSupportView ? 'supportView' : 'notSupportView';
    if (this.childrenCollectionsName[cacheKey]) {
      return this.childrenCollectionsName[cacheKey].slice();
    }

    const children: string[] = [];
    const collections = [...this.getCollections()];
    const getChildrenCollectionsInner = (collectionName: string) => {
      const inheritCollections = collections.filter((v: any) => {
        return [...v.inherits]?.includes(collectionName);
      });
      inheritCollections.forEach((v) => {
        const collectionKey = v.name;
        children.push(collectionKey);
        return getChildrenCollectionsInner(collectionKey);
      });
      if (isSupportView) {
        const sourceCollections = collections.filter((v: any) => {
          return [...v.sources]?.length === 1 && v?.sources[0] === collectionName;
        });
        sourceCollections.forEach((v) => {
          const collectionKey = v.name;
          children.push(v.name);
          return getChildrenCollectionsInner(collectionKey);
        });
      }
      return _.uniq(children);
    };

    this.childrenCollectionsName[cacheKey] = getChildrenCollectionsInner(name);
    return this.childrenCollectionsName[cacheKey];
  }

  getAllCollectionsInheritChain(name) {
    if (this.allCollectionsInheritChain) {
      return this.allCollectionsInheritChain.slice();
    }

    const collectionsInheritChain = [name];
    const getInheritChain = (name: string) => {
      const collection = this.getCollection(name);
      if (collection) {
        const { inherits } = collection as any;
        const children = this.getChildrenCollectionsName(name);
        // 搜寻祖先表
        if (inherits) {
          for (let index = 0; index < inherits.length; index++) {
            const collectionKey = inherits[index];
            if (collectionsInheritChain.includes(collectionKey)) {
              continue;
            }
            collectionsInheritChain.push(collectionKey);
            getInheritChain(collectionKey);
          }
        }
        // 搜寻后代表
        if (children) {
          for (let index = 0; index < children.length; index++) {
            const collection = this.getCollection(children[index]);
            const collectionKey = collection.name;
            if (collectionsInheritChain.includes(collectionKey)) {
              continue;
            }
            collectionsInheritChain.push(collectionKey);
            getInheritChain(collectionKey);
          }
        }
      }
      return collectionsInheritChain;
    };

    this.allCollectionsInheritChain = getInheritChain(name);
    return this.allCollectionsInheritChain || [];
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

  clone() {
    const newCollection = new Collection(_.cloneDeep(this.options));
    newCollection.setDataSource(this.dataSource);
    return newCollection;
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
    if (Array.isArray(this.filterTargetKey) && this.filterTargetKey.length === 1) {
      return record[this.filterTargetKey[0]];
    }
    return _.pick(record, this.filterTargetKey);
  }

  get titleableFields() {
    return this.getFields().filter((field) => field.titleable);
  }

  get hidden() {
    return this.options.hidden || false;
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
  get template() {
    return this.options.template;
  }
  get storage() {
    return this.options.storage || 'local';
  }
  get title() {
    return this.flowEngine.translate(this.options.title, { ns: 'lm-collections' }) || this.name;
  }

  get titleCollectionField() {
    const titleFieldName = this.options.titleField || this.filterTargetKey;
    const titleCollectionField = this.getField(titleFieldName);
    return titleCollectionField;
  }

  initInherits() {
    this.inherits.clear();
    for (const inherit of this.options.inherits || []) {
      const collection = this.collectionManager.getCollection(inherit);
      if (!collection) {
        console.warn(`Warning: Collection ${inherit} not found for collection ${this.name}`);
        continue;
      }
      this.inherits.set(inherit, collection);
    }
  }

  setDataSource(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  setOptions(newOptions: any = {}, options: { clearFields?: boolean } = {}) {
    Object.keys(this.options).forEach((key) => delete this.options[key]);
    Object.assign(this.options, newOptions);
    this.initInherits();
    if (options.clearFields) {
      this.clearFields();
    }
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

  getToOneAssociationFields(): CollectionField[] {
    return this.getAssociationFields(['one']);
  }

  getAssociationFields(types = []): CollectionField[] {
    if (types.includes('new')) {
      return this.getFields().filter((field) => ['hasMany', 'belongsToMany', 'belongsToArray'].includes(field.type));
    }
    if (types.includes('many') && types.includes('one')) {
      return this.getFields().filter((field) => field.isAssociationField());
    }
    if (types.includes('many')) {
      return this.getFields().filter((field) => ['hasMany', 'belongsToMany', 'belongsToArray'].includes(field.type));
    }
    if (types.includes('one')) {
      return this.getFields().filter((field) => ['hasOne', 'belongsTo'].includes(field.type));
    }
    return this.getFields().filter((field) => field.isAssociationField());
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

  getFieldByPath(fieldPath: string): CollectionField | undefined {
    const [fieldName, ...otherKeys] = fieldPath.split('.');
    const field = this.getField(fieldName);
    if (otherKeys.length === 0) {
      return field;
    }
    if (!field?.targetCollection) {
      return null;
    }
    return field.targetCollection.getFieldByPath(otherKeys.join('.'));
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

  get targetCollectionTitleFieldName() {
    return this.targetCollection?.titleCollectionField?.name;
  }

  get targetCollectionTitleField() {
    return this.targetCollection?.titleCollectionField;
  }

  get flowEngine() {
    return this.collection.flowEngine;
  }

  get dataSourceKey() {
    return this.collection?.dataSourceKey;
  }

  get resourceName() {
    return `${this.collection.name}.${this.name}`;
  }

  get collectionName() {
    return this.collection?.name || this.options.collectionName;
  }

  get readonly() {
    return this.options.readonly || this.options.uiSchema?.['x-read-pretty'] || false;
  }

  get titleable() {
    return !!(this.options.titleable ?? this.options.titleUsable);
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
    const titleValue = this.options?.uiSchema?.title || this.options?.title;
    return this.flowEngine.translate(titleValue, { ns: 'lm-collections' }) || this.options.name;
  }

  set title(value: string) {
    this.options.title = value;
  }

  get enum(): any[] {
    const options = this.options.uiSchema?.enum || [];
    if (this.type === 'integer') {
      return options.map((v) => {
        if (typeof v !== 'object') {
          return v;
        }
        if (v.value === null || v.value === undefined) {
          return v;
        }
        return {
          ...v,
          label: v.label ? this.flowEngine.translate(v.label, { ns: 'lm-collections' }) : v.label,
          value: Number(v.value),
        };
      });
    }
    return options.map((v) => {
      return {
        ...v,
        label: this.flowEngine.translate(v.label, { ns: 'lm-collections' }),
      };
    });
  }

  get defaultValue() {
    return this.options.defaultValue == null ? undefined : this.options.defaultValue;
  }

  get interface() {
    return this.options.interface;
  }

  get filterable() {
    return this.options.filterable || this.getInterfaceOptions()?.filterable;
  }
  get inputable() {
    return this.options.inputable;
  }

  get uiSchema() {
    return this.options.uiSchema || {};
  }

  get targetCollection() {
    return this.options.target && this.collection?.collectionManager.getCollection(this.options.target);
  }

  get validation() {
    return this.options.validation;
  }

  getComponentProps() {
    const { type, target } = this.options;
    const componentProps = _.omitBy(
      {
        ..._.omit(this.options.uiSchema?.['x-component-props'] || {}, 'fieldNames'),
        options: this.enum.length ? this.enum : undefined,
        mode: this.type === 'array' ? 'multiple' : undefined,
        multiple: target ? ['belongsToMany', 'hasMany', 'belongsToArray'].includes(type) : undefined,
        maxCount: target && !['belongsToMany', 'hasMany', 'belongsToArray'].includes(type) ? 1 : undefined,
        target: target,
        template: this.targetCollection?.template,
      },
      _.isUndefined,
    );
    if (this.validation) {
      // 初始化数据表字段jio验证规则
      const rules = [];
      const schema = jioToJoiSchema(this.validation);
      const label = this.title;
      rules.push({
        validator: (_, value) => {
          const { error } = schema.validate(value, {
            context: { label },
            abortEarly: false,
          });

          if (error) {
            const message = error.details.map((d: any) => d.message.replace(/"value"/g, `"${label}"`)).join(', ');
            return Promise.reject(message);
          }

          return Promise.resolve();
        },
      });
      componentProps.rules = rules;
    }
    return componentProps;
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
    const app = this.flowEngine.context.app;
    return app.dataSourceManager.collectionFieldInterfaceManager.getFieldInterface(this.interface);
  }

  getFilterOperators() {
    const opts = this.getInterfaceOptions();
    return opts?.filterable?.operators || [];
  }

  getSubclassesOf(baseClass: string) {
    return this.flowEngine.getSubclassesOf(baseClass, (M, name) => {
      const interfaceMatch = isFieldInterfaceMatch(M['supportedFieldInterfaces'], this.interface);
      return interfaceMatch;
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

  isAssociationField() {
    return ['belongsToMany', 'belongsTo', 'hasMany', 'hasOne', 'belongsToArray'].includes(this.type);
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

export { jioToJoiSchema };
