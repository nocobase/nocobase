import lodash from 'lodash';
import { getRepositoryFromParams } from './utils';

export function proxyToRepository(paramKeys: string[], repositoryMethod: string) {
  return async function (ctx, next) {
    const repository = getRepositoryFromParams(ctx);

    const callObj = lodash.pick(ctx.action.params, paramKeys);
    callObj.context = ctx;

    ctx.body = await repository[repositoryMethod](callObj);

    ctx.status = 200;
    await next();
  };
}
