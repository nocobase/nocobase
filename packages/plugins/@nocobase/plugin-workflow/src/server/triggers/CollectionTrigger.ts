import { Model, Transactionable } from '@nocobase/database';
import Trigger from '.';
import { toJSON } from '../utils';
import type { WorkflowModel } from '../types';
import { parseCollectionName, ICollection } from '@nocobase/data-source-manager';

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

function getFieldRawName(collection: ICollection, name: string) {
  const field = collection.getField(name);
  if (field && field.options.type === 'belongsTo') {
    return field.options.foreignKey;
  }
  return name;
}

// async function, should return promise
async function handler(this: CollectionTrigger, workflow: WorkflowModel, data: Model, options) {
  const { condition, changed, mode, appends } = workflow.config;
  const [dataSourceName, collectionName] = parseCollectionName(workflow.config.collection);
  const collection = this.workflow.app.dataSourceManager?.dataSources
    .get(dataSourceName)
    .collectionManager.getCollection(collectionName);
  const { transaction, context } = options;
  const { repository, filterTargetKey } = collection;

  // NOTE: if no configured fields changed, do not trigger
  if (
    changed &&
    changed.length &&
    changed
      .filter(
        (name) => !['linkTo', 'hasOne', 'hasMany', 'belongsToMany'].includes(collection.getField(name).options.type),
      )
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
        $and: [condition, { [filterTargetKey]: data[filterTargetKey] }],
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
      filterByTk: data[filterTargetKey],
      appends: Array.from(includeFields),
      transaction,
    });
  }

  // TODO: `result.toJSON()` throws error
  const json = toJSON(result);

  if (workflow.sync) {
    await this.workflow.trigger(
      workflow,
      { data: json, stack: context?.stack },
      {
        transaction: this.workflow.useDataSourceTransaction(dataSourceName, transaction),
      },
    );
  } else {
    this.workflow.trigger(workflow, { data: json, stack: context?.stack });
  }
}

export default class CollectionTrigger extends Trigger {
  events = new Map();

  on(workflow: WorkflowModel) {
    const { collection, mode } = workflow.config;
    if (!collection) {
      return;
    }
    const [dataSourceName, collectionName] = parseCollectionName(collection);
    // @ts-ignore
    const { db } = this.workflow.app.dataSourceManager?.dataSources.get(dataSourceName)?.collectionManager ?? {};
    if (!db || !db.getCollection(collectionName)) {
      return;
    }

    for (const [key, type] of MODE_BITMAP_EVENTS.entries()) {
      const event = `${collectionName}.${type}`;
      const name = getHookId(workflow, `${collection}.${type}`);
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
    const { collection, mode } = workflow.config;
    if (!collection) {
      return;
    }
    const [dataSourceName, collectionName] = parseCollectionName(collection);
    // @ts-ignore
    const { db } = this.workflow.app.dataSourceManager.dataSources.get(dataSourceName)?.collectionManager ?? {};
    if (!db || !db.getCollection(collectionName)) {
      return;
    }

    for (const [key, type] of MODE_BITMAP_EVENTS.entries()) {
      const name = getHookId(workflow, `${collection}.${type}`);
      if (mode & key) {
        const listener = this.events.get(name);
        if (listener) {
          db.off(`${collectionName}.${type}`, listener);
          this.events.delete(name);
        }
      }
    }
  }

  async validateEvent(workflow: WorkflowModel, context: any, options: Transactionable): Promise<boolean> {
    if (context.stack) {
      const existed = await workflow.countExecutions({
        where: {
          id: context.stack,
        },
        transaction: options.transaction,
      });

      if (existed) {
        this.workflow
          .getLogger(workflow.id)
          .warn(
            `workflow ${workflow.id} has already been triggered in stack executions (${context.stack}), and newly triggering will be skipped.`,
          );

        return false;
      }
    }

    return true;
  }
}
