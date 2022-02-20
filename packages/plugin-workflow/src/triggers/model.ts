import WorkflowModel from "../models/Workflow";

export interface ModelChangeTriggerConfig {
  collection: string;
  mode: number;
  // TODO: ICondition
  filter: any;
}

const MODE_BITMAP = {
  CREATE: 1,
  UPDATE: 2,
  DESTROY: 4
};

const MODE_BITMAP_EVENTS = new Map();
MODE_BITMAP_EVENTS.set(MODE_BITMAP.CREATE, 'afterCreate');
MODE_BITMAP_EVENTS.set(MODE_BITMAP.UPDATE, 'afterUpdate');
MODE_BITMAP_EVENTS.set(MODE_BITMAP.DESTROY, 'afterDestroy');

export default {
  name: 'model',
  on(this: WorkflowModel, callback: Function) {
    const { database } = <typeof WorkflowModel>this.constructor;
    const { collection, mode } = this.config;
    const { model } = database.getCollection(collection);
    const handler = (data: any, options) => callback({ data }, options);
    // TODO: duplication when mode change should be considered
    for (let [key, event] of MODE_BITMAP_EVENTS.entries()) {
      if (mode & key) {
        model.addHook(event, this.getHookId(), handler);
      }
    }
  },
  off(this: WorkflowModel) {
    const { database } = <typeof WorkflowModel>this.constructor;
    const { collection, mode } = this.config;
    const { model } = database.getCollection(collection);
    for (let [key, event] of MODE_BITMAP_EVENTS.entries()) {
      if (mode & key) {
        model.removeHook(event, this.getHookId());
      }
    }
  }
}