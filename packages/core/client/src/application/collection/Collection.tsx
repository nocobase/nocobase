import { SchemaKey } from '@formily/react';
import { filter } from 'lodash';

import type { CollectionManagerV2 } from './CollectionManager';
import type { Application } from '../Application';

type dumpable = 'required' | 'optional' | 'skip';
type CollectionSortable = string | boolean | { name?: string; scopeKey?: string };

export interface CollectionFieldOptionsV2 {
  name?: any;
  collectionName?: string;
  sourceKey?: string; // association field
  uiSchema?: any;
  target?: string;

  [key: string]: any;
}

export interface CollectionOptionsV2 {
  name: string;
  title?: string;
  namespace?: string;
  isLocal?: boolean;
  /**
   * Used for @nocobase/plugin-duplicator
   * @see packages/core/database/src/collection-group-manager.tss
   *
   * @prop {'required' | 'optional' | 'skip'} dumpable - Determine whether the collection is dumped
   * @prop {string[] | string} [with] - Collections dumped with this collection
   * @prop {any} [delayRestore] - A function to execute after all collections are restored
   */
  duplicator?:
    | dumpable
    | {
        dumpable: dumpable;
        with?: string[] | string;
        delayRestore?: any;
      };

  tableName?: string;
  inherits?: string[] | string;
  inherit?: string;
  key?: string;
  viewName?: string;
  writableView?: boolean;

  filterTargetKey?: string;
  fields?: CollectionFieldOptionsV2[];
  model?: any;
  repository?: any;
  sortable?: CollectionSortable;
  /**
   * @default true
   */
  autoGenId?: boolean;
  /**
   * @default 'options'
   */
  magicAttribute?: string;

  tree?: string;

  template?: string;

  isThrough?: boolean;
  autoCreate?: boolean;
  resource?: string;
  collectionName?: string;
  sourceKey?: string;
  uiSchema?: any;
  [key: string]: any;
}

export type GetCollectionFieldPredicate =
  | ((collection: CollectionFieldOptionsV2) => boolean)
  | CollectionFieldOptionsV2
  | keyof CollectionFieldOptionsV2;

export class CollectionV2 {
  protected options: CollectionOptionsV2;
  protected fieldsMap: Record<string, CollectionFieldOptionsV2>;
  protected primaryKey: string;
  app: Application;
  collectionManager: CollectionManagerV2;

  constructor(options: CollectionOptionsV2, app: Application) {
    this.app = app;
    this.collectionManager = app.collectionManager;
    this.options = options;
  }
  get fields() {
    return this.options?.fields || [];
  }

  get name() {
    return this.options.name;
  }
  get key() {
    return this.options.key;
  }
  get title() {
    return this.options.title;
  }
  get inherit() {
    return this.options.inherit;
  }
  get targetKey() {
    return this.options.targetKey;
  }
  get isLocal() {
    return this.options.isLocal;
  }
  getPrimaryKey(): string {
    if (this.primaryKey) {
      return this.primaryKey;
    }
    if (this.options.targetKey) {
      return this.options.targetKey;
    }
    const field = this.getFields('primaryKey')[0];
    this.primaryKey = field ? field.name : 'id';

    return this.primaryKey;
  }

  get inherits() {
    return this.options.inherits || [];
  }

  get titleField() {
    return this.hasField(this.options.titleField) ? this.options.titleField : this.primaryKey;
  }

  get sources() {
    return this.options.sources || [];
  }

  get template() {
    return this.options.template;
  }

  get tableName() {
    return this.options.tableName;
  }

  get viewName() {
    return this.options.viewName;
  }

  get writableView() {
    return this.options.writableView;
  }

  get filterTargetKey() {
    return this.options.filterTargetKey;
  }

  get sortable() {
    return this.options.sortable;
  }

  get autoGenId() {
    return this.options.autoGenId;
  }

  get magicAttribute() {
    return this.options.magicAttribute;
  }

  get tree() {
    return this.options.tree;
  }

  get isThrough() {
    return this.options.isThrough;
  }

  get autoCreate() {
    return this.options.autoCreate;
  }

  get resource() {
    return this.options.resource;
  }

  getOptions() {
    return this.options;
  }
  getOption<K extends keyof CollectionOptionsV2>(key: K): CollectionOptionsV2[K] {
    return this.options[key];
  }
  /**
   * Get fields
   * @param predicate https://www.lodashjs.com/docs/lodash.filter
   * @example
   * getFields() // 获取所有字段
   * getFields({ name: 'nickname' }) // 获取 name: 'nickname' 字段
   * getFields('primaryKey') // 获取 primaryKey: true 字段
   * getFields((field) => field.name === 'nickname') // 获取 name: 'nickname' 字段
   */
  getFields(predicate?: GetCollectionFieldPredicate) {
    return predicate ? filter(this.fields, predicate) : this.fields;
  }
  getFieldsMap() {
    if (!this.fieldsMap) {
      this.fieldsMap = this.getFields().reduce((memo, field) => {
        memo[field.name] = field;
        return memo;
      }, {});
    }
    return this.fieldsMap;
  }
  getField(name: SchemaKey) {
    const fieldsMap = this.getFieldsMap();

    if (String(name).split('.').length > 1) {
      const [fieldName, ...others] = String(name).split('.');
      const field = fieldsMap[fieldName];
      if (!field) return null;

      const collectionName = field?.target;
      if (!collectionName) return null;

      const collection = this.collectionManager.getCollection(collectionName);
      if (!collection) return null;

      return collection.getField(others.join('.'));
    }
    return fieldsMap[name];
  }
  hasField(name: SchemaKey) {
    return !!this.getField(name);
  }
}
