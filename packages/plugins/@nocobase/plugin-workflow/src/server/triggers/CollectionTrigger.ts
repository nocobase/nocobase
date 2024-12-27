/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { pick } from 'lodash';
import { isValidFilter } from '@nocobase/utils';
import { Collection, Model, Transactionable } from '@nocobase/database';
import { ICollection, parseCollectionName, SequelizeCollectionManager } from '@nocobase/data-source-manager';

import Trigger from '.';
import { toJSON } from '../utils';
import type { WorkflowModel } from '../types';
import type { EventOptions } from '../Plugin';
import { Context } from '@nocobase/actions';

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

export default class CollectionTrigger extends Trigger {
  events = new Map();

  // async function, should return promise
  private static async handler(this: CollectionTrigger, workflow: WorkflowModel, data: Model, options) {
    const [dataSourceName] = parseCollectionName(workflow.config.collection);
    const transaction = this.workflow.useDataSourceTransaction(dataSourceName, options.transaction);
    const ctx = await this.prepare(workflow, data, { ...options, transaction });
    if (!ctx) {
      return;
    }

    if (workflow.sync) {
      await this.workflow.trigger(workflow, ctx, {
        transaction,
        stack: ctx.stack,
      });
    } else {
      if (transaction) {
        transaction.afterCommit(() => {
          this.workflow.trigger(workflow, ctx, { stack: ctx.stack });
        });
      } else {
        this.workflow.trigger(workflow, ctx, { stack: ctx.stack });
      }
    }
  }

  async prepare(workflow: WorkflowModel, data: Model | Record<string, any> | string | number, options) {
    const { condition, changed, mode, appends } = workflow.config;
    const [dataSourceName, collectionName] = parseCollectionName(workflow.config.collection);
    const { collectionManager } = this.workflow.app.dataSourceManager.dataSources.get(dataSourceName);
    const collection: Collection = (collectionManager as SequelizeCollectionManager).getCollection(collectionName);
    const { transaction, context } = options;
    const { repository, filterTargetKey } = collection;

    let dataModel = data;
    if (typeof dataModel === 'string' || typeof dataModel === 'number') {
      dataModel = await repository.findOne({
        filterByTk: data,
      });
    }
    // NOTE: if no configured fields changed, do not trigger
    if (
      dataModel instanceof Model &&
      changed &&
      changed.length &&
      changed
        .filter((name) => {
          const field = collection.getField(name);
          return field && !['linkTo', 'hasOne', 'hasMany', 'belongsToMany'].includes(field.options.type);
        })
        .every((name) => !dataModel.changedWithAssociations(getFieldRawName(collection, name)))
    ) {
      return null;
    }

    const filterByTk = Array.isArray(filterTargetKey)
      ? pick(dataModel, filterTargetKey)
      : { [filterTargetKey]: dataModel[filterTargetKey] };
    // NOTE: if no configured condition, or not match, do not trigger
    if (isValidFilter(condition) && !(mode & MODE_BITMAP.DESTROY)) {
      // TODO: change to map filter format to calculation format
      // const calculation = toCalculation(condition);
      const count = await repository.count({
        filterByTk,
        filter: condition,
        context,
        transaction,
      });

      if (!count) {
        return null;
      }
    }

    let result = dataModel;

    if (appends?.length && !(mode & MODE_BITMAP.DESTROY)) {
      const includeFields = appends.reduce((set, field) => {
        set.add(field.split('.')[0]);
        set.add(field);
        return set;
      }, new Set());

      // @ts-ignore
      result = await repository.findOne({
        filterByTk,
        appends: Array.from(includeFields),
        transaction,
      });
    }

    return {
      data: toJSON(result),
      stack: context?.stack,
    };
  }

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
          const listener = (<typeof CollectionTrigger>this.constructor).handler.bind(this, workflow);
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

  // async validateEvent(workflow: WorkflowModel, context: any, options: Transactionable): Promise<boolean> {
  //   if (context.stack) {
  //     const existed = await workflow.countExecutions({
  //       where: {
  //         id: context.stack,
  //       },
  //       transaction: options.transaction,
  //     });

  //     if (existed) {
  //       this.workflow
  //         .getLogger(workflow.id)
  //         .warn(
  //           `workflow ${workflow.id} has already been triggered in stack executions (${context.stack}), and newly triggering will be skipped.`,
  //         );

  //       return false;
  //     }
  //   }

  //   return true;
  // }

  async execute(workflow: WorkflowModel, values, options: EventOptions) {
    const ctx = await this.prepare(workflow, values?.data, options);
    const [dataSourceName] = parseCollectionName(workflow.config.collection);
    const { transaction } = options;
    return this.workflow.trigger(
      workflow,
      { ...ctx },
      {
        ...options,
        transaction: this.workflow.useDataSourceTransaction(dataSourceName, transaction),
        stack: options.stack,
      },
    );
  }
}
