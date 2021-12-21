import { FieldOptions } from './collection-manager';

export class FieldSchemaOptions {
  options: FieldOptions;

  constructor(options: FieldOptions) {
    this.options = options;
  }

  get saveValues() {
    return {
      name: this.options.name,
      type: this.options.type,
      options: this.options,
    };
  }
}
