import { BaseFlowModel, IModelComponentProps } from './flowModel';
import { ActionModel } from './actionModel';
import { define, observable } from '@formily/reactive';
import { Application } from '../../application';

export class BlockModel extends BaseFlowModel {
  public actions: Map<string, ActionModel>;

  constructor(uid: string, app: Application) {
    super(uid, app);
    this.actions = observable(new Map<string, ActionModel>());
    define(this, {
      actions: observable,
    });
  }

  setActions(actions: ActionModel[]) {
    this.actions.clear();
    actions.forEach(action => this.actions.set(action.uid, action));
  }

  addAction(action: ActionModel) {
    this.actions.set(action.uid, action);
  }

  getAction(uid: string): ActionModel | undefined {
    return this.actions.get(uid);
  }

  removeAction(uid: string): boolean {
    return this.actions.delete(uid);
  }

  getActions(): ActionModel[] {
    return Array.from(this.actions.values());
  }
} 