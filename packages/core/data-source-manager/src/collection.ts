import { CollectionOptions, ICollection, ICollectionManager, IRepository } from './types';
import { default as lodash } from 'lodash';
import merge from 'deepmerge';
import { Field } from '@nocobase/database';

export class Collection implements ICollection {
  repository: IRepository;
  fields: Map<string, any> = new Map<string, any>();

  constructor(
    protected options: CollectionOptions,
    protected collectionManager: ICollectionManager,
  ) {
    this.setRepository(options.repository);
  }

  updateOptions(options: CollectionOptions, mergeOptions?: any) {
    let newOptions = lodash.cloneDeep(options);
    newOptions = merge(this.options, newOptions, mergeOptions);
    this.options = newOptions;

    if (options.repository) {
      this.setRepository(options.repository);
    }

    return this;
  }

  setField(name: string, options: any) {
    const field = this.getField(name);

    if (field) {
      field.updateOptions(options);
    }
  }

  getField<F extends Field>(name: string): F {
    return this.fields.get(name);
  }

  protected setRepository(repository: any) {
    this.repository = this.collectionManager.getRegisteredRepository(repository || 'Repository');
  }
}
