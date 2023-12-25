import { cloneDeep, omit, merge } from 'lodash';
import { ICollectionTemplate } from '../../collection-manager';
import { CollectionV2 } from './Collection';

export interface CollectionTemplateOptions extends ICollectionTemplate {
  Collection?: typeof CollectionV2;
  transform?: (collection: CollectionV2) => void;
}

export class CollectionTemplateV2 {
  protected options: CollectionTemplateOptions;

  constructor(options: CollectionTemplateOptions) {
    this.options = options;
  }

  get name() {
    return this.options.name;
  }

  get Collection() {
    return this.options.Collection;
  }

  get transform() {
    return this.options.transform;
  }

  getOption<K extends keyof CollectionTemplateOptions>(key: K): CollectionTemplateOptions[K] {
    return this.options[key];
  }

  getOptions(): CollectionTemplateOptions {
    return {
      ...cloneDeep(omit(this.options, 'Collection')),
      Collection: this.options.Collection,
    };
  }

  setOptions(options: CollectionTemplateOptions) {
    merge(this.options, options);
  }
}
