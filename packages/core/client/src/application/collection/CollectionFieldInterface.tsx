import { cloneDeep, merge } from 'lodash';
import { IField } from '../../collection-manager';

export type CollectionFieldInterfaceOptions = IField;

export class CollectionFieldInterfaceV2 {
  protected options: CollectionFieldInterfaceOptions;

  constructor(options: CollectionFieldInterfaceOptions) {
    this.options = options;
  }

  get name() {
    return this.options.name;
  }

  get group() {
    return this.options.group;
  }

  get title() {
    return this.options.title;
  }

  getOption<K extends keyof CollectionFieldInterfaceOptions>(key: K): CollectionFieldInterfaceOptions[K] {
    return this.options[key];
  }

  getOptions(): CollectionFieldInterfaceOptions {
    return cloneDeep(this.options);
  }

  setOptions(options: CollectionFieldInterfaceOptions) {
    merge(this.options, options);
  }
}
