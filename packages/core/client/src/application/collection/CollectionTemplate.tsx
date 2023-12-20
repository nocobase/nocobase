import { cloneDeep, omit } from 'lodash';
import { ICollectionTemplate } from '../../collection-manager';
import { CollectionV2 } from './Collection';

export interface CollectionTemplateOptions extends ICollectionTemplate {
  Collection: typeof CollectionV2;
}

export class CollectionTemplateV2 {
  public options: CollectionTemplateOptions;

  constructor(options: CollectionTemplateOptions) {
    this.options = options;
  }

  get Collection() {
    return this.options.Collection;
  }

  get name() {
    return this.options.name;
  }

  getOptions() {
    return cloneDeep(omit(this.options, 'Collection'));
  }
}
