import WorkflowModel from "../models/Workflow";

export interface IDataChangeTriggerConfig {
  collection: string;
  // TODO: ICondition
  filter: any;
}

export function afterCreate(this: WorkflowModel, config: IDataChangeTriggerConfig, callback: Function) {
  // @ts-ignore
  const { database } = this.constructor;
  const { model } = database.getCollection(config.collection);
  model.addHook('afterCreate', `workflow-${this.get('id')}`, (data: any, options) => callback({ data }, options));
}
