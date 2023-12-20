import { cloneDeep } from 'lodash';
import { IField } from '../../collection-manager';

export class CollectionFieldInterfaceV2 {
  public options: IField;

  constructor(options: IField) {
    this.options = options;
  }

  get name() {
    return this.options.name;
  }

  getOptions() {
    return cloneDeep(this.options);
  }
}
