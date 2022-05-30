import { Model } from "@nocobase/database";
import { Trigger } from ".";
import WorkflowModel from "../models/Workflow";

export interface CollectionChangeTriggerConfig {
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
MODE_BITMAP_EVENTS.set(MODE_BITMAP.CREATE, 'afterCreateWithAssociations');
MODE_BITMAP_EVENTS.set(MODE_BITMAP.UPDATE, 'afterUpdateWithAssociations');
MODE_BITMAP_EVENTS.set(MODE_BITMAP.DESTROY, 'afterDestroy');



function getHookId(workflow, type) {
  return `${type}#${workflow.id}`;
}

// async function, should return promise
function handler(this: WorkflowModel, data: Model, options) {
  const { condition, changed } = this.config;
  // NOTE: if no configured fields changed, do not trigger
  if (changed && changed.length && changed.every(name => !data.changed(name))) {
    return;
  }
  // NOTE: if no configured condition match, do not trigger
  if (condition && condition.$and.length) {
    // TODO: check all conditions in condition against data
    // const calculation = toCalculation(condition);
  }

  return this.trigger({ data: data.get() }, options);
}

export default class CollectionTrigger implements Trigger {
  db;

  events = new Map();

  constructor({ app }) {
    this.db = app.db;
  }

  on(workflow: WorkflowModel) {
    const { collection, mode } = workflow.config;
    const Collection = this.db.getCollection(collection);
    if (!Collection) {
      return;
    }

    for (let [key, type] of MODE_BITMAP_EVENTS.entries()) {
      const event = `${collection}.${type}`;
      const name = getHookId(workflow, event);
      if (mode & key) {
        if (!this.events.has(name)) {
          const listener = handler.bind(workflow);
          this.events.set(name, listener);
          this.db.on(event, listener);
        }
      } else {
        const listener = this.events.get(name);
        if (listener) {
          this.db.off(event, listener);
          this.events.delete(name);
        }
      }
    }
  }

  off(workflow: WorkflowModel) {
    const { collection, mode } = workflow.config;
    const Collection = this.db.getCollection(collection);
    if (!Collection) {
      return;
    }
    for (let [key, type] of MODE_BITMAP_EVENTS.entries()) {
      const event = `${collection}.${type}`;
      const name = getHookId(workflow, event);
      if (mode & key) {
        const listener = this.events.get(name);
        if (listener) {
          this.db.off(event, listener);
          this.events.delete(name);
        }
      }
    }
  }
}
