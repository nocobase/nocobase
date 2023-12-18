import { SchemaKey } from '@formily/react';
import { CollectionOptions } from '../../collection-manager';

export class CollectionV2 {
  data: CollectionOptions;
  constructor(data: CollectionOptions) {
    this.data = data;
  }
  get primaryKey() {
    if (this.data.targetKey) {
      return this.data.targetKey;
    }
    const fields = this.getFields();
    const field = fields.find((field) => field.primaryKey);
    return field ? field.name : 'id';
  }
  get titleField() {
    // ?
    return this.data.title;
  }
  getFields() {
    return this.data.fields || [];
  }
  getField(name: SchemaKey) {
    const fields = this.getFields();
    return fields.find((field) => field.name === name);
  }
}
