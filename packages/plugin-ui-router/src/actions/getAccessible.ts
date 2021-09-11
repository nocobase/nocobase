import { Model, ModelCtor } from '@nocobase/database';
import { Context, Next } from '@nocobase/actions';
import FlatToNested from 'flat-to-nested';

const flatToNested = new FlatToNested({
  id: 'key',
  parent: 'parentKey',
  children: 'routes',
});

export default async (ctx: Context, next: Next) => {
  const Route = ctx.db.getModel('routes');
  const routes = await Route.findAll(Route.parseApiJson({
    sort: 'sort',
  }));
  const data = flatToNested.convert(routes.map(route => route.toProps()));
  ctx.body = data.routes;
  await next();
}
