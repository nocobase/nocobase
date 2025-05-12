import { observable, action, define } from '@formily/reactive';
import { BaseModel, IModelComponentProps } from './baseModel';

// 重新导出IModelComponentProps
export { IModelComponentProps };

export interface IModelField {
  id: string;
  sort?: number;
  name: string;
  type: string;
  [key: string]: any;
}

export interface IModelAction {
  id: string;
  sort?: number;
  name: string;
  modelId: string;
  [key: string]: any;
}

export class DataBlockModel extends BaseModel {
  public fields: Map<string, IModelField>;
  public actions: Map<string, IModelAction>;

  constructor(uid: string, initialProps: IModelComponentProps = {}, initialHidden = false) {
    super(uid, initialProps, initialHidden);

    this.fields = observable(new Map<string, IModelField>());
    this.actions = observable(new Map<string, IModelAction>());

    define(this, {
      setFields: action,
      addField: action,
      // getField: action, // get方法不需要是action
      removeField: action,
      setActions: action,
      addAction: action,
      // getAction: action,
      removeAction: action,
    });
  }

  setFields(fields: IModelField[]) {
    this.fields.clear();
    fields.forEach(field => this.fields.set(field.id, field));
  }

  addField(field: IModelField) {
    if (this.fields.has(field.id)) {
      console.warn(`Field with id "${field.id}" already exists. Updating it.`);
    }
    this.fields.set(field.id, field);
  }

  getField(id: string): IModelField | undefined {
    return this.fields.get(id);
  }

  removeField(id: string): boolean {
    const result = this.fields.delete(id);
    return result;
  }

  getFields(): IModelField[] {
    return Array.from(this.fields.values());
  }

  setActions(actions: IModelAction[]) {
    this.actions.clear();
    actions.forEach(actionItem => this.actions.set(actionItem.id, actionItem));
  }

  addAction(actionItem: IModelAction) {
    if (this.actions.has(actionItem.id)) {
      console.warn(`Action with id "${actionItem.id}" already exists. Updating it.`);
    }
    this.actions.set(actionItem.id, actionItem);
  }

  getAction(id: string): IModelAction | undefined {
    return this.actions.get(id);
  }

  removeAction(id: string): boolean {
    const result = this.actions.delete(id);
    return result;
  }

  getActions(): IModelAction[] {
    return Array.from(this.actions.values());
  }
} 