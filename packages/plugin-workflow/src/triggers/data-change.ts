export interface IDataChangeTriggerConfig {
  collection: string;
  // TODO: ICondition
  filter: any;
}

export function afterCreate(config: IDataChangeTriggerConfig, callback: Function) {
  const Model = this.database.getModel(config.collection);
  Model.addHook('afterCreate', `workflow-${this.get('id')}`, (data: typeof Model, options) => callback({ data }, options));
}
