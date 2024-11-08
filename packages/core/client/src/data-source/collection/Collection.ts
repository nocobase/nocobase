/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaKey } from '@formily/react';
import { filter } from 'lodash';

import type { CollectionManager } from './CollectionManager';

type dumpable = 'required' | 'optional' | 'skip';
type CollectionSortable = string | boolean | { name?: string; scopeKey?: string };

export interface CollectionFieldOptions {
  name?: any;
  collectionName?: string;
  sourceKey?: string; // association field
  uiSchema?: any;
  target?: string;

  [key: string]: any;
}

export interface CollectionOptions {
  name: string;
  title?: string;
  dataSource?: string;
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
  fields?: CollectionFieldOptions[];
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
  | ((collection: CollectionFieldOptions) => boolean)
  | CollectionFieldOptions
  | keyof CollectionFieldOptions;

export class Collection {
  protected fieldsMap: Record<string, CollectionFieldOptions>;
  protected primaryKey: string;
  constructor(
    protected options: CollectionOptions,
    public collectionManager: CollectionManager,
  ) {}
  get fields() {
    return this.options.fields || [];
  }

  get app() {
    return this.collectionManager.app;
  }

  get dataSource() {
    return this.options.dataSource;
  }

  get sourceKey() {
    return this.options.sourceKey;
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
  get hidden() {
    return this.options.hidden;
  }
  get description() {
    return this.options.description;
  }
  get duplicator() {
    return this.options.duplicator;
  }
  get category() {
    return this.options.category;
  }
  get targetKey() {
    return this.options.targetKey;
  }
  get model() {
    return this.options.model;
  }
  get createdBy() {
    return this.options.createdBy;
  }
  get updatedBy() {
    return this.options.updatedBy;
  }
  get logging() {
    return this.options.logging;
  }
  get from() {
    return this.options.from;
  }
  get rawTitle() {
    return this.options.rawTitle;
  }
  getPrimaryKey(): string {
    if (this.primaryKey) {
      return this.primaryKey;
    }
    if (this.options.targetKey) {
      return this.options.targetKey;
    }
    const field = this.getFields({ primaryKey: true })[0];
    this.primaryKey = field?.name;

    return this.primaryKey;
  }
  getFilterTargetKey() {
    return this.filterTargetKey || this.getPrimaryKey() || 'id';
  }

  get inherits() {
    return this.options.inherits || [];
  }

  get titleField() {
    return this.hasField(this.options.titleField) ? this.options.titleField : this.getPrimaryKey();
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

  setOption(key: string, value: any) {
    this.options[key] = value;
    return this;
  }

  getOptions() {
    return this.options;
  }

  getOption<K extends keyof CollectionOptions>(key: K): CollectionOptions[K] {
    return this.options[key];
  }
  /**
   * Get fields
   * @param predicate https://www.lodashjs.com/docs/lodash.filter
   * @example
   * getFields() // get all fields
   * getFields({ name: 'nickname' }) // Get the field with `name: 'nickname'`
   * getFields('primaryKey') // Get the field with `primaryKey: true`
   * getFields((field) => field.name === 'nickname') // Get the field with `name: 'nickname`'
   */
  getFields(predicate?: GetCollectionFieldPredicate) {
    return predicate ? filter(this.fields, predicate) : this.fields;
  }

  getAllFields(predicate?: GetCollectionFieldPredicate) {
    return this.getFields(predicate);
  }

  protected getFieldsMap() {
    if (!this.fieldsMap) {
      this.fieldsMap = this.getFields().reduce((memo, field) => {
        memo[field.name] = field;
        return memo;
      }, {});
    }
    return this.fieldsMap;
  }

  private getFieldByAssociationName(name: SchemaKey) {
    const fieldsMap = this.getFieldsMap();
    const [fieldName, ...others] = String(name).split('.');
    const field = fieldsMap[fieldName];
    if (!field) return undefined;

    const collectionName = field?.target;
    if (!collectionName) return undefined;

    const collection = this.collectionManager.getCollection(collectionName);
    if (!collection) return undefined;

    return collection.getField(others.join('.'));
  }

  getField(name: SchemaKey) {
    if (!name) return undefined;
    const fieldsMap = this.getFieldsMap();
    if (String(name).split('.').length > 1) {
      const associationRes = this.getFieldByAssociationName(name);
      if (associationRes) return associationRes;

      if (typeof name === 'string' && name.startsWith(`${this.name}.`)) {
        name = name.replace(`${this.name}.`, '');
        return this.getField(name);
      }
      return undefined;
    }
    return fieldsMap[name];
  }
  hasField(name: SchemaKey) {
    return !!this.getField(name);
  }

  isTitleField(field: CollectionFieldOptions) {
    return this.app.dataSourceManager.collectionFieldInterfaceManager.getFieldInterface(field.interface)?.titleUsable;
  }

  /**
   * is inherited from other collections
   * @returns boolean
   */
  isInherited() {
    return this.inherits.length > 0;
  }
}
