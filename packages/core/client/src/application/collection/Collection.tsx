import { SchemaKey } from '@formily/react';
import { CollectionFieldOptions, CollectionOptions } from '../../collection-manager';
import { filter } from 'lodash';

export class CollectionV2 {
  protected options: CollectionOptions;
  protected fields: Record<string, CollectionFieldOptions>;

  constructor(options: CollectionOptions) {
    this.options = options;
    this.fields = (options.fields || []).reduce((memo, field) => {
      memo[field.name] = field;
      return memo;
    }, {});
  }
  get name() {
    return this.options.name;
  }
  get primaryKey() {
    if (this.options.targetKey) {
      return this.options.targetKey;
    }
    const field = this.getFields('primaryKey')[0];
    return field ? field.name : 'id';
  }
  get titleField() {
    return this.hasField(this.options.titleField) ? this.options.titleField : this.primaryKey;
  }
  getOption(key: keyof CollectionOptions) {
    return this.options[key];
  }
  hasField(name: SchemaKey) {
    return !!this.getField(name);
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
  getFields(
    predicate?:
      | ((collection: CollectionFieldOptions) => boolean)
      | CollectionFieldOptions
      | keyof CollectionFieldOptions,
  ) {
    return filter(this.options.fields || [], predicate);
  }
  getField(name: SchemaKey) {
    return this.fields[name];
  }
}
