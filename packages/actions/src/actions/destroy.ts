import { Context } from '..';
import { getRepositoryFromParams } from './utils';
import { Action } from '@nocobase/resourcer';
import { DestroyOptions, FindOneOptions } from '@nocobase/database';
import lodash from 'lodash';

interface DestroyActionOptions {
  filterArgBuilder?(action: Action): FindOneOptions;
  defaultAssociatedKey?: string;
  afterDestroy?(ctx: Context): void;
}

export function destroyActionBuilder(options?: DestroyActionOptions) {
  return async function destroy(ctx: Context, next) {
    if (lodash.get(options, 'defaultAssociatedKey')) {
      ctx.action.params.associatedKey = options.defaultAssociatedKey;
    }

    const repository = getRepositoryFromParams(ctx);

    const { resourceIndex, filter } = ctx.action.params;

    let destroyOptions: DestroyOptions = {
      filter,
      context: ctx,
    };

    const filterArgBuilderFn = lodash.get(options, 'filterArgBuilder');

    if (!filterArgBuilderFn) {
      destroyOptions['filterByPk'] = resourceIndex;
    } else {
      destroyOptions = {
        ...destroyOptions,
        ...filterArgBuilderFn(ctx.action),
      };
    }

    const instance = await repository.destroy(destroyOptions);

    const afterDestroyFn = lodash.get(options, 'afterDestroy');

    if (afterDestroyFn) {
      await afterDestroyFn(ctx);
    }

    ctx.body = instance;
    await next();
  };
}

export const destroy = destroyActionBuilder();
