import { BaseFlowModel, IModelComponentProps } from './flowModel';
import { Application } from '../../application';

export class ActionModel extends BaseFlowModel {
  public event?: string;
  constructor(uid: string, app: Application, event?: string) {
    super(uid, app);
    this.event = event;
  }
} 