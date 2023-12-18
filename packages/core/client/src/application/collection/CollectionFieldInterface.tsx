import { IField } from '../../collection-manager';

export class CollectionFieldInterface {
  public fieldInterface: IField;

  constructor(fieldInterface: IField) {
    this.fieldInterface = fieldInterface;
  }

  get name() {
    return this.fieldInterface.name;
  }
}
