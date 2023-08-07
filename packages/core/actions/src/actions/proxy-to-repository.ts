import lodash from 'lodash';
import { Context } from '../index';
import { getRepositoryFromParams } from '../utils';

export function proxyToRepository(paramKeys: string[], repositoryMethod: string) {
  return async function (ctx: Context, next) {
    const repository = getRepositoryFromParams(ctx);

    const callObj = lodash.pick(ctx.action.params, paramKeys);
    callObj.context = ctx;

    ctx.body = await repository[repositoryMethod](callObj);

    ctx.status = 200;
    await next();
  };
}
