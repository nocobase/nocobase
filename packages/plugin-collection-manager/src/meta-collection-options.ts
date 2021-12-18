import { CollectionOptions } from './collection-manager';
import lodash from 'lodash';

export class MetaCollectionOptions {
  options: CollectionOptions;

  constructor(options: CollectionOptions) {
    this.options = lodash.cloneDeep(options || {});
  }

  get collectionValues() {
    return {
      name: this.options.name,
      title: this.options.title,
      options: this.options,
    };
  }
}
