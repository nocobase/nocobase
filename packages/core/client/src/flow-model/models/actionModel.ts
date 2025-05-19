import { FlowModel, IModelComponentProps } from './flowModel';
import { Application } from '../../application';

export class ActionModel extends FlowModel {
  public event?: string;
  constructor(uid: string, app: Application, event?: string) {
    super(uid, app);
    this.event = event;
  }
} 