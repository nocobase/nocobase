import { FieldOptions, IField } from './types';

export class CollectionField implements IField {
  options: FieldOptions;

  constructor(options: FieldOptions) {
    this.updateOptions(options);
  }

  updateOptions(options: any) {
    this.options = {
      ...this.options,
      ...options,
    };
  }
}
