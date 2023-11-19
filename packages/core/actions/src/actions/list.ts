import { assign } from '@nocobase/utils';
import { Context } from '..';
import { getRepositoryFromParams, pageArgsToLimitArgs } from '../utils';
import { DEFAULT_PAGE, DEFAULT_PER_PAGE } from '../constants';

function totalPage(total, pageSize): number {
  return Math.ceil(total / pageSize);
}

function findArgs(ctx: Context) {
  const resourceName = ctx.action.resourceName;
  const params = ctx.action.params;
  if (params.tree) {
    const [collectionName, associationName] = resourceName.split('.');
    const collection = ctx.db.getCollection(resourceName);
    // tree collection 或者关系表是 tree collection
    if (collection.options.tree && !(associationName && collectionName === collection.name)) {
      const foreignKey = collection.treeParentField?.foreignKey || 'parentId';
      assign(params, { filter: { [foreignKey]: null } }, { filter: 'andMerge' });
    }
  }
  const { tree, fields, filter, appends, except, sort } = params;

  return { tree, filter, fields, appends, except, sort };
}

async function listWithPagination(ctx: Context) {
  const { page = DEFAULT_PAGE, pageSize = DEFAULT_PER_PAGE } = ctx.action.params;

  const repository = getRepositoryFromParams(ctx);

  const options = {
    context: ctx,
    ...findArgs(ctx),
    ...pageArgsToLimitArgs(parseInt(String(page)), parseInt(String(pageSize))),
  };

  Object.keys(options).forEach((key) => {
    if (options[key] === undefined) {
      delete options[key];
    }
  });

  const [rows, count] = await repository.findAndCount(options);

  ctx.body = {
    count,
    rows,
    page: Number(page),
    pageSize: Number(pageSize),
    totalPage: totalPage(count, pageSize),
  };
}

async function listWithNonPaged(ctx: Context) {
  const repository = getRepositoryFromParams(ctx);

  const rows = await repository.find({ context: ctx, ...findArgs(ctx) });

  ctx.body = rows;
}

export async function list(ctx: Context, next) {
  const { paginate } = ctx.action.params;

  if (paginate === false || paginate === 'false') {
    await listWithNonPaged(ctx);
    ctx.paginate = false;
  } else {
    await listWithPagination(ctx);
    ctx.paginate = true;
  }

  await next();
}
