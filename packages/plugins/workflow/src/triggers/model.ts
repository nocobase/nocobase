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
    const { collection, mode, filter } = this.config;
    const Collection = database.getCollection(collection);
    if (!Collection) {
      return;
    }
    // async function, should return promise
    const handler = (data: any, options) => {
      if (filter) {
        // TODO: check all conditions in filter against data
      }
      return callback({ data: data.get() }, options);
    };
    // TODO: duplication when mode change should be considered
    for (let [key, event] of MODE_BITMAP_EVENTS.entries()) {
      if (mode & key) {
        Collection.model.addHook(event, this.getHookId(), handler);
      }
    }
  },
  off(this: WorkflowModel) {
    const { database } = <typeof WorkflowModel>this.constructor;
    const { collection, mode } = this.config;
    const Collection = database.getCollection(collection);
    if (!Collection) {
      return;
    }
    for (let [key, event] of MODE_BITMAP_EVENTS.entries()) {
      if (mode & key) {
        Collection.model.removeHook(event, this.getHookId());
      }
    }
  }
}
