import { BaseModel, IModelComponentProps } from './baseModel';

export class ActionModel extends BaseModel {
  public event?: string;
  constructor(uid: string, defaultProps?: IModelComponentProps, event?: string) {
    super(uid, defaultProps);
    this.event = event;
  }
} 