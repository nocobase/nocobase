import { BlockModel } from './blockModel';
import { IModelComponentProps } from './baseModel';
import { ObjectResource } from '../resources/objectResource';

export class DataBlockModel extends BlockModel {
  public resource: ObjectResource;
  public fields: any[];

  constructor(uid: string, defaultProps?: IModelComponentProps, resource?: ObjectResource) {
    super(uid, defaultProps);
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