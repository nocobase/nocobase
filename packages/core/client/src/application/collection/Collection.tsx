import { CollectionOptions } from '../../collection-manager';

export class CollectionV2 {
  data: CollectionOptions;
  constructor(data: CollectionOptions) {
    this.data = data;
  }
  // get primaryKey() { }
  // get titleField() { }
  getFields() {
    return this.data.fields || [];
  }
  // getField(name: string) {
  //   return
  // }
}
