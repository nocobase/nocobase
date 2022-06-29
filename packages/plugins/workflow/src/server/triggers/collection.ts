import { Model } from "@nocobase/database";
import Plugin, { Trigger } from "..";
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
async function handler(this: CollectionTrigger, workflow: WorkflowModel, data: Model, options) {
  const { collection, condition, changed } = workflow.config;
  // NOTE: if no configured fields changed, do not trigger
  if (changed && changed.length && changed.every(name => !data.changed(name))) {
    // TODO: temp comment out
    // return;
  }
  // NOTE: if no configured condition match, do not trigger
  if (condition && condition.$and?.length) {
    // TODO: change to map filter format to calculation format
    // const calculation = toCalculation(condition);
    const { repository, model } = (<typeof Model>data.constructor).database.getCollection(collection);
    const { transaction } = options;
    const count = await repository.count({
      filter: {
        $and: [
          condition,
          { [model.primaryKeyAttribute]: data[model.primaryKeyAttribute] }
        ]
      },
      transaction
    });

    if (!count) {
      return;
    }
  }

  return this.plugin.trigger(workflow, { data: data.get() }, {
    transaction: options.transaction
  });
}

export default class CollectionTrigger extends Trigger {
  events = new Map();

  on(workflow: WorkflowModel) {
    const { db } = this.plugin.app;
    const { collection, mode } = workflow.config;
    const Collection = db.getCollection(collection);
    if (!Collection) {
      return;
    }

    for (let [key, type] of MODE_BITMAP_EVENTS.entries()) {
      const event = `${collection}.${type}`;
      const name = getHookId(workflow, event);
      if (mode & key) {
        if (!this.events.has(name)) {
          const listener = handler.bind(this, workflow);
          this.events.set(name, listener);
          db.on(event, listener);
        }
      } else {
        const listener = this.events.get(name);
        if (listener) {
          db.off(event, listener);
          this.events.delete(name);
        }
      }
    }
  }

  off(workflow: WorkflowModel) {
    const { db } = this.plugin.app;
    const { collection, mode } = workflow.config;
    const Collection = db.getCollection(collection);
    if (!Collection) {
      return;
    }
    for (let [key, type] of MODE_BITMAP_EVENTS.entries()) {
      const event = `${collection}.${type}`;
      const name = getHookId(workflow, event);
      if (mode & key) {
        const listener = this.events.get(name);
        if (listener) {
          db.off(event, listener);
          this.events.delete(name);
        }
      }
    }
  }
}
