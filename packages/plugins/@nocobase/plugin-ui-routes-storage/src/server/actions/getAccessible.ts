import { Context, Next } from '@nocobase/actions';
import FlatToNested from 'flat-to-nested';

const flatToNested = new FlatToNested({
  id: 'key',
  parent: 'parentKey',
  children: 'routes',
});

export const getAccessible = async (ctx: Context, next: Next) => {
  const repository = ctx.db.getRepository('uiRoutes');
  const routes = await repository.find({
    sort: ['sort'],
  });
  const data = flatToNested.convert(routes.map((route) => route.toJSON()));
  ctx.body = data?.routes || [];
  await next();
};
