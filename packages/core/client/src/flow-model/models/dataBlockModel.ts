import { BlockModel } from './blockModel';
import { ObjectResource } from '../resources/objectResource';
import { Application } from '../../application';

export class DataBlockModel extends BlockModel {
  public resource: ObjectResource;
  public fields: any[];

  constructor(uid: string, app: Application, resource?: ObjectResource) {
    super(uid, app);
    this.resource = resource;
    this.fields = [];
  }

  setFields(fields: any[]) {
    this.fields = fields;
  }

  getFields() {
    return this.fields;
  }
} 