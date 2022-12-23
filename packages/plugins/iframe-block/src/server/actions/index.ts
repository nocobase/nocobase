import { Context, Next } from '@nocobase/actions';
import { Repository } from '@nocobase/database';

export async function getHtml(ctx: Context, next: Next) {
  let { filterByTk } = ctx.action.params;
  const { resourceName } = ctx.action;
  const repository = ctx.db.getRepository<any>(resourceName) as Repository;
  const model = await repository.findById(filterByTk);
  ctx.body = model.get('html');
  ctx.withoutDataWrapping = true;

  ctx.set({
    'Content-Type': 'text/html; charset=UTF-8',
  });

  await next();
}

export async function getJson(ctx: Context, next: Next) {
  let { filterByTk } = ctx.action.params;
  const { resourceName } = ctx.action;
  const repository = ctx.db.getRepository<any>(resourceName) as Repository;
  const model = await repository.findById(filterByTk);
  ctx.body = { html: model.get('html') };
  await next();
}

export async function createHtml(ctx: Context, next: Next) {
  const { values } = ctx.action.params;
  const { resourceName } = ctx.action;
  const repository = ctx.db.getRepository<any>(resourceName) as Repository;

  const model = await repository.create({
    values,
  });

  ctx.body = { id: model.get('id') };
  await next();
}

export async function updateHtml(ctx: Context, next: Next) {
  const { values, filterByTk } = ctx.action.params;
  const { resourceName } = ctx.action;
  const repository = ctx.db.getRepository<any>(resourceName) as Repository;

  const model = await repository.update({
    filterByTk,
    values,
  });

  ctx.body = model[0];
  await next();
}
