import { IField } from './types';

export class CollectionField implements IField {
  options: any;
  constructor(options: any) {
    this.updateOptions(options);
  }

  updateOptions(options: any) {
    Object.assign(this, options);
  }
}
