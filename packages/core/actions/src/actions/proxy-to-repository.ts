import { getRepositoryFromParams } from '../utils';
import { Context } from '../index';
import lodash from 'lodash';

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
