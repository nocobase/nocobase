import { cloneDeep } from 'lodash';
import { IField } from '../../collection-manager';

export type CollectionFieldInterfaceOptions = IField;

export class CollectionFieldInterfaceV2 {
  public options: CollectionFieldInterfaceOptions;

  constructor(options: CollectionFieldInterfaceOptions) {
    this.options = options;
  }

  get name() {
    return this.options.name;
  }

  getOption<K extends keyof CollectionFieldInterfaceOptions>(key: K): CollectionFieldInterfaceOptions[K] {
    return this.options[key];
  }

  getOptions(): CollectionFieldInterfaceOptions {
    return cloneDeep(this.options);
  }
}
