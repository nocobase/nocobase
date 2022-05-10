import WorkflowModel from "../models/Workflow";

export interface ModelChangeTriggerConfig {
  collection: string;
  mode: number;
  // TODO: ICondition
  condition: any;
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

// async function, should return promise
function bindHandler(this: WorkflowModel, callback: Function) {
  const { condition, changed } = this.config;
  return (data: any, options) => {
    // NOTE: if no configured fields changed, do not trigger
    if (changed && changed.length && changed.every(name => !data.changed(name))) {
      return;
    }
    // NOTE: if no configured condition match, do not trigger
    if (condition && condition.$and.length) {
      // TODO: check all conditions in condition against data
      // const calculation = toCalculation(condition);
    }

    return callback({ data: data.get() }, options);
  };
}

export default {
  name: 'collection',
  on(this: WorkflowModel, callback: Function) {
    const { database } = <typeof WorkflowModel>this.constructor;
    const { collection, mode } = this.config;
    const Collection = database.getCollection(collection);
    if (!Collection) {
      return;
    }

    for (let [key, event] of MODE_BITMAP_EVENTS.entries()) {
      if (mode & key) {
        if (!Collection.model.options.hooks[event]?.find(item => item.name && item.name === this.getHookId())) {
          Collection.model.addHook(event, this.getHookId(), bindHandler.call(this, callback));
        }
      } else {
        Collection.model.removeHook(event, this.getHookId());
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
