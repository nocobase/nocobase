import { BaseModel, IModelComponentProps } from './baseModel';
import { Application } from '../../application';

export class ActionModel extends BaseModel {
  public event?: string;
  constructor(uid: string, app: Application, event?: string) {
    super(uid, app);
    this.event = event;
  }
} 