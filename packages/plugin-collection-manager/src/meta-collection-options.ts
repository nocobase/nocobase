import { CollectionOptions } from './collection-manager';
import lodash from 'lodash';

export class MetaCollectionOptions {
  options: CollectionOptions;

  constructor(options: CollectionOptions) {
    this.options = lodash.cloneDeep(options);
  }

  get name() {
    return this.options.name;
  }

  get collectionValues() {
    return {
      name: this.name,
      options: this.options,
    };
  }
}
