import { Context } from '..';
import { Collection, TargetKey, Repository, SortField, Model } from '@nocobase/database';
import { getRepositoryFromParams } from '../utils';
import lodash from 'lodash';

export async function move(ctx: Context, next) {
  const repository = getRepositoryFromParams(ctx);

  const { sourceId, targetId, sortField, targetScope, sticky, method } = ctx.action.params.values || ctx.action.params;

  if (repository instanceof Repository) {
    const sortAbleCollection = new SortAbleCollection(repository.collection, sortField);

    if (sourceId && targetId) {
      await sortAbleCollection.move(sourceId, targetId, {
        insertAfter: method === 'insertAfter',
      });
    }

    // change scope
    if (sourceId && targetScope !== undefined) {
      await sortAbleCollection.changeScope(sourceId, targetScope, method);
    }

    if (sourceId && sticky) {
      await sortAbleCollection.sticky(sourceId);
    }
  }
  ctx.body = 'ok';
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

  constructor(collection: Collection, fieldName = 'sort') {
    this.collection = collection;
    this.field = collection.getField(fieldName);

    if (!(this.field instanceof SortField)) {
      throw new Error(`${fieldName} is not a sort field`);
    }

    this.scopeKey = this.field.get('scopeKey');
  }

  private async getInstanceScopeValue(instance) {
    const isAssociatedScope = this.scopeKey.includes('.');

    if (isAssociatedScope) {
      try {
        return await instance.lazyLoadGet(this.scopeKey);
      } catch (e) {
        if (e.message.includes('not found')) {
          return null;
        }
      }
    }

    return instance.get(this.scopeKey);
  }

  // insert source position to target position
  async move(sourceInstanceId: TargetKey, targetInstanceId: TargetKey, options: MoveOptions = {}) {
    const sourceInstance = await this.collection.repository.findById(sourceInstanceId);
    const targetInstance = await this.collection.repository.findById(targetInstanceId);

    if (this.scopeKey) {
      const currentScopeValue = await this.getInstanceScopeValue(sourceInstance);
      const newScopeValue = await this.getInstanceScopeValue(targetInstance);

      if (currentScopeValue !== newScopeValue) {
        await this.changeScope(sourceInstanceId, {
          [this.scopeKey]: newScopeValue,
        });

        await sourceInstance.reload();
      }
    }

    await this.sameScopeMove(sourceInstance, targetInstance, options);
  }

  async changeScope(sourceInstanceId: TargetKey, targetScope: any, method?: string) {
    const sourceInstance = await this.collection.repository.findById(sourceInstanceId);
    const targetScopeValue = lodash.isPlainObject(targetScope) ? targetScope[this.scopeKey] : targetScope;

    const isAssociatedScope = this.scopeKey.includes('.');

    const currentScopeValue = await this.getInstanceScopeValue(sourceInstance);

    if (currentScopeValue !== targetScopeValue) {
      if (isAssociatedScope) {
        console.log(`update associated scope from ${currentScopeValue} to ${targetScopeValue}`);
        await sourceInstance.lazyLoadSet(this.scopeKey, targetScopeValue);
      } else {
        await sourceInstance.update(
          {
            [this.scopeKey]: targetScopeValue,
          },
          {
            hooks: false,
          },
        );
      }

      if (method === 'prepend') {
        await this.sticky(sourceInstanceId);
      } else {
        // reset sort
        console.log('reset sort', this.collection.name, sourceInstance.get('id'));
        await this.collection.context.database.emitAsync(`${this.collection.name}.afterChangeScope`, sourceInstance);
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

    let scopeValue = this.scopeKey ? await this.getInstanceScopeValue(sourceInstance) : null;

    let updateCondition;
    let change;

    if (targetSort > sourceSort) {
      updateCondition = {
        $gt: sourceSort,
        $lte: targetSort,
      };
      change = -1;
    } else {
      updateCondition = {
        $lt: sourceSort,
        $gte: targetSort,
      };
      change = 1;
    }

    const filter = {
      [fieldName]: updateCondition,
    };

    if (scopeValue) {
      filter[this.scopeKey] = scopeValue;
    }

    const instanceIdToUpdate = await this.collection.repository.find({
      filter,
    });

    for (const instance of instanceIdToUpdate) {
      await instance.update(
        {
          [fieldName]: instance.get(fieldName) + change,
        },
        {
          silent: true,
          hooks: false,
        },
      );
    }

    await sourceInstance.update(
      {
        [fieldName]: targetSort,
      },
      {
        hooks: false,
        silent: true,
      },
    );
  }
}
