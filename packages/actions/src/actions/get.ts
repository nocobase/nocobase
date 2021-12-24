import { Context } from '..';
import { getRepositoryFromParams } from './utils';
import { Action } from '@nocobase/resourcer';
import { FindOneOptions } from '@nocobase/database';
import lodash from 'lodash';

interface GetActionOptions {
  filterArgBuilder(action: Action): FindOneOptions;
  defaultAssociatedKey?: string;
}

export function getActionBuilder(options?: GetActionOptions) {
  return async function get(ctx: Context, next) {
    if (lodash.get(options, 'defaultAssociatedKey')) {
      ctx.action.params.associatedKey = options.defaultAssociatedKey;
    }

    const repository = getRepositoryFromParams(ctx);

    const { resourceIndex, fields, appends, except, filter } = ctx.action.params;

    let findOptions = {
      fields,
      appends,
      except,
      filter,
    };

    const filterArgBuilderFn = lodash.get(options, 'filterArgBuilder');

    if (!filterArgBuilderFn) {
      findOptions['filterByPk'] = resourceIndex;
    } else {
      findOptions = {
        ...findOptions,
        ...filterArgBuilderFn(ctx.action),
      };
    }

    const instance = await repository.findOne(findOptions);

    ctx.body = instance;
    await next();
  };
}

export const get = getActionBuilder();
