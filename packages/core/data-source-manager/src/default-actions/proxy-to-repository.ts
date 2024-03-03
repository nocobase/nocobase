import lodash from 'lodash';
import { DataSource } from '../data-source';
import { getRepositoryFromParams } from './utils';

export function proxyToRepository(paramKeys: string[] | ((ctx: any) => object), repositoryMethod: string) {
  return async function (ctx, next) {
    const repository = getRepositoryFromParams(ctx);
    const callObj =
      typeof paramKeys === 'function' ? paramKeys(ctx) : { ...lodash.pick(ctx.action.params, paramKeys), context: ctx };
    const dataSource: DataSource = ctx.dataSource;

    if (!repository[repositoryMethod]) {
      throw new Error(
        `Repository can not handle action ${repositoryMethod} for ${ctx.action.resourceName} in ${dataSource.name}`,
      );
    }

    ctx.body = await repository[repositoryMethod](callObj);
    await next();
  };
}
