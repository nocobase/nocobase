import { cloneDeep, omit } from 'lodash';
import { ICollectionTemplate } from '../../collection-manager';
import { CollectionV2 } from './Collection';

export interface CollectionTemplateOptions extends ICollectionTemplate {
  Collection?: typeof CollectionV2;
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

  getOption<K extends keyof CollectionTemplateOptions>(key: K): CollectionTemplateOptions[K] {
    return this.options[key];
  }

  getOptions(): Omit<CollectionTemplateOptions, 'Collection'> {
    return cloneDeep(omit(this.options, 'Collection'));
  }
}
