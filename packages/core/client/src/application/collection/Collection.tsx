import { SchemaKey } from '@formily/react';
import { filter } from 'lodash';

import type { CollectionManagerV2 } from './CollectionManager';
import { CollectionFieldOptions, CollectionOptions } from '../../collection-manager';

export type GetCollectionFieldPredicate =
  | ((collection: CollectionFieldOptions) => boolean)
  | CollectionFieldOptions
  | keyof CollectionFieldOptions;

export class CollectionV2 {
  protected options: CollectionOptions;
  protected fields: Record<string, CollectionFieldOptions> = {};
  public collectionManager: CollectionManagerV2;

  constructor(options: CollectionOptions, collectionManager: CollectionManagerV2) {
    this.options = options;
    this.setFields(options.fields || []);
    this.collectionManager = collectionManager;
  }
  get name() {
    return this.options.name;
  }
  get primaryKey(): string {
    if (this.options.targetKey) {
      return this.options.targetKey;
    }
    const field = this.getFields('primaryKey')[0];
    return field ? field.name : 'id';
  }
  get titleFieldName() {
    return this.hasField(this.options.titleField) ? this.options.titleField : this.primaryKey;
  }
  private setFields(fields: CollectionFieldOptions[]) {
    this.fields = fields.reduce((memo, field) => {
      memo[field.name] = field;
      return memo;
    }, {});
  }
  getOptions() {
    return this.options;
  }
  getOption<K extends keyof CollectionOptions>(key: K): CollectionOptions[K] {
    return this.options[key];
  }
  setOptions<CollectionOptions>(options: CollectionOptions) {
    Object.assign(this.options, options);
    this.setFields(this.options.fields || []);
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
    return filter(this.options.fields || [], predicate);
  }
  getField(name: SchemaKey) {
    return this.fields[name];
  }
  hasField(name: SchemaKey) {
    return !!this.getField(name);
  }
}
