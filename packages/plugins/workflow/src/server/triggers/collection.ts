import { Collection, Model } from '@nocobase/database';
import { Trigger } from '..';
import { toJSON } from '../utils';
import type { WorkflowModel } from '../types';

export interface CollectionChangeTriggerConfig {
  collection: string;
  mode: number;
  // TODO: ICondition
  condition: any;
}

const MODE_BITMAP = {
  CREATE: 1,
  UPDATE: 2,
  DESTROY: 4,
};

const MODE_BITMAP_EVENTS = new Map();
MODE_BITMAP_EVENTS.set(MODE_BITMAP.CREATE, 'afterCreateWithAssociations');
MODE_BITMAP_EVENTS.set(MODE_BITMAP.UPDATE, 'afterUpdateWithAssociations');
MODE_BITMAP_EVENTS.set(MODE_BITMAP.DESTROY, 'afterDestroy');

function getHookId(workflow, type) {
  return `${type}#${workflow.id}`;
}

function getFieldRawName(collection: Collection, name: string) {
  const field = collection.getField(name);
  if (field && field.type === 'belongsTo') {
    return field.foreignKey;
  }
  return name;
}

// async function, should return promise
async function handler(this: CollectionTrigger, workflow: WorkflowModel, data: Model, options) {
  const { collection: collectionName, condition, changed, mode, appends } = workflow.config;
  const collection = (<typeof Model>data.constructor).database.getCollection(collectionName);
  const { transaction, context } = options;
  const { repository, model } = collection;

  // NOTE: if no configured fields changed, do not trigger
  if (
    changed &&
    changed.length &&
    changed
      .filter((name) => !['linkTo', 'hasOne', 'hasMany', 'belongsToMany'].includes(collection.getField(name).type))
      .every((name) => !data.changedWithAssociations(getFieldRawName(collection, name)))
  ) {
    return;
  }
  // NOTE: if no configured condition match, do not trigger
  if (condition && condition.$and?.length) {
    // TODO: change to map filter format to calculation format
    // const calculation = toCalculation(condition);
    const count = await repository.count({
      filter: {
        $and: [condition, { [model.primaryKeyAttribute]: data[model.primaryKeyAttribute] }],
      },
      context,
      transaction,
    });

    if (!count) {
      return;
    }
  }

  let result = data;

  if (appends?.length && !(mode & MODE_BITMAP.DESTROY)) {
    const includeFields = appends.reduce((set, field) => {
      set.add(field.split('.')[0]);
      set.add(field);
      return set;
    }, new Set());
    result = await repository.findOne({
      filterByTk: data[model.primaryKeyAttribute],
      appends: Array.from(includeFields),
      transaction,
    });
  }

  // TODO: `result.toJSON()` throws error
  const json = toJSON(result);

  this.plugin.trigger(
    workflow,
    { data: json },
    {
      context,
    },
  );
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

    for (const [key, type] of MODE_BITMAP_EVENTS.entries()) {
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
    for (const [key, type] of MODE_BITMAP_EVENTS.entries()) {
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
