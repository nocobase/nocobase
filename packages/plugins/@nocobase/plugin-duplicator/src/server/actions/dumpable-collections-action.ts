import { Dumper } from '../dumper';
import { getApp } from './get-app';
import _ from 'lodash';

export default async function dumpableCollections(ctx, next) {
  ctx.withoutDataWrapping = true;

  const app = await getApp(ctx, ctx.request.query.app);
  const dumper = new Dumper(app);

  const dumpableCollections = (await dumper.dumpableCollections()).map((c) => {
    return {
      name: c.name,
      dataType: c.dataType,
      origin: c.origin,
      title: c.title,
    };
  });

  ctx.body = _(dumpableCollections)
    .groupBy('dataType')
    .mapValues((items) => _.sortBy(items, (item) => item.origin.name))
    .value();

  await next();
}
