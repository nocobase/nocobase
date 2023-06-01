import { getRepositoryFromParams } from '../utils';
import { Context } from '@nocobase/actions';
import lodash from 'lodash';

export function proxyToRepository(paramKeys: string[], repositoryMethod: string) {
  return async function (ctx: Context, next) {
    const repository = getRepositoryFromParams(ctx);

    const callObj = lodash.pick(ctx.action.params, paramKeys);

    ctx.body = await repository[repositoryMethod](callObj);

    ctx.status = 200;
    await next();
  };
}
