import { FieldOptions } from './collection-manager';

export class FieldSchemaOptions {
  options: FieldOptions;
  constructor(options: FieldOptions) {
    this.options = options;
  }

  get collectionValues() {
    return {};
  }
}
