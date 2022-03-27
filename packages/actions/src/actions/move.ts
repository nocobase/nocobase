import { Op, Model } from 'sequelize';

import { Context } from '..';
import { Collection, TargetKey, Repository, SortField } from '@nocobase/database';
import { getRepositoryFromParams } from '../utils';

export async function move(ctx: Context, next) {
  const repository = getRepositoryFromParams(ctx);

  const { sourceId, targetId, sortField, targetScope, sticky, method } = ctx.action.params;

  if (repository instanceof Repository) {
    const sortAbleCollection = new SortAbleCollection(repository.collection, sortField);

    if (sourceId && targetId) {
      await sortAbleCollection.move(sourceId, targetId, {
        insertAfter: method === 'insertAfter',
      });
    }

    // change scope
    if (sourceId && targetScope) {
      await sortAbleCollection.changeScope(sourceId, targetScope, method);
    }

    if (sourceId && sticky) {
      await sortAbleCollection.sticky(sourceId);
    }
  }

  await next();
}

interface SortPosition {
  scope?: string;
  id: TargetKey;
}

interface MoveOptions {
  insertAfter?: boolean;
}

export class SortAbleCollection {
  collection: Collection;
  field: SortField;
  scopeKey: string;

  constructor(collection: Collection, fieldName: string = 'sort') {
    this.collection = collection;
    this.field = collection.getField(fieldName);

    if (!(this.field instanceof SortField)) {
      throw new Error(`${fieldName} is not a sort field`);
    }

    this.scopeKey = this.field.get('scopeKey');
  }

  // insert source position to target position
  async move(sourceInstanceId: TargetKey, targetInstanceId: TargetKey, options: MoveOptions = {}) {
    const sourceInstance = await this.collection.repository.findById(sourceInstanceId);
    const targetInstance = await this.collection.repository.findById(targetInstanceId);

    if (this.scopeKey && sourceInstance.get(this.scopeKey) !== targetInstance.get(this.scopeKey)) {
      await sourceInstance.update({
        [this.scopeKey]: targetInstance.get(this.scopeKey),
      });
    }

    await this.sameScopeMove(sourceInstance, targetInstance, options);
  }

  async changeScope(sourceInstanceId: TargetKey, targetScope: any, method?: string) {
    const sourceInstance = await this.collection.repository.findById(sourceInstanceId);
    const targetScopeValue = targetScope[this.scopeKey];

    if (targetScopeValue && sourceInstance.get(this.scopeKey) !== targetScopeValue) {
      await sourceInstance.update(
        {
          [this.scopeKey]: targetScopeValue,
        },
        {
          silent: false,
        },
      );

      if (method === 'prepend') {
        await this.sticky(sourceInstanceId);
      }
    }
  }

  async sticky(sourceInstanceId: TargetKey) {
    const sourceInstance = await this.collection.repository.findById(sourceInstanceId);
    await sourceInstance.update(
      {
        [this.field.get('name')]: 0,
      },
      {
        silent: true,
      },
    );
  }

  async sameScopeMove(sourceInstance: Model, targetInstance: Model, options: MoveOptions) {
    const fieldName = this.field.get('name');

    const sourceSort = sourceInstance.get(fieldName);
    let targetSort = targetInstance.get(fieldName);

    if (options.insertAfter) {
      targetSort = targetSort + 1;
    }

    let scopeValue = this.scopeKey ? sourceInstance.get(this.scopeKey) : null;
    let updateCondition;
    let change;

    if (targetSort > sourceSort) {
      updateCondition = {
        [Op.gt]: sourceSort,
        [Op.lte]: targetSort,
      };
      change = -1;
    } else {
      updateCondition = {
        [Op.lt]: sourceSort,
        [Op.gte]: targetSort,
      };
      change = 1;
    }

    const where = {
      [fieldName]: updateCondition,
    };

    if (scopeValue) {
      where[this.scopeKey] = {
        [Op.eq]: scopeValue,
      };
    }

    await this.collection.model.increment(fieldName, {
      where,
      by: change,
      silent: true,
    });

    await sourceInstance.update(
      {
        [fieldName]: targetSort,
      },
      {
        silent: true,
      },
    );
  }
}
